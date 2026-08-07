"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { KycStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { putObject, isObjectStoreConfigured } from "@/lib/storage";
import {
  MAX_UPLOAD_BYTES,
  documentTypeSchema,
  humanBytes,
  isAcceptedImage,
  sidesFor,
} from "@/lib/kyc";

export type KycState = { ok: boolean; message: string };

export type KycSubmissionView = {
  id: number;
  status: KycStatus;
  documentType: string;
  livenessSimulated: boolean;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  documentCount: number;
};

const KYC_PATH = "/dashboard/verification";

async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}

function unexpected(scope: string, error: unknown): KycState {
  console.error(`[kyc:${scope}]`, error);
  return {
    ok: false,
    message: "Something went wrong on our end. Please try again.",
  };
}

/** The newest attempt, which is what the whole screen renders from. */
export async function getLatestSubmission(): Promise<KycSubmissionView | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const row = await prisma.kycSubmission.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      documentType: true,
      livenessSimulated: true,
      createdAt: true,
      reviewedAt: true,
      reviewNote: true,
      _count: { select: { documents: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    documentType: row.documentType,
    livenessSimulated: row.livenessSimulated,
    submittedAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewNote: row.reviewNote,
    documentCount: row._count.documents,
  };
}

/**
 * Takes the document images and opens a submission. Files are validated here
 * rather than trusting the input's `accept` attribute, which is only a picker
 * hint and is trivially bypassed.
 */
export async function submitDocuments(
  _prev: KycState,
  formData: FormData,
): Promise<KycState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const parsedType = documentTypeSchema.safeParse(formData.get("documentType"));
  if (!parsedType.success) {
    return { ok: false, message: "Choose a document type." };
  }
  const documentType = parsedType.data;

  const kinds = ["DOCUMENT_FRONT", "DOCUMENT_BACK"] as const;
  const required = sidesFor(documentType);
  const files: { kind: (typeof kinds)[number]; file: File }[] = [];

  for (let i = 0; i < required; i++) {
    const value = formData.get(kinds[i]);
    if (!(value instanceof File) || value.size === 0) {
      return {
        ok: false,
        message:
          required === 1
            ? "Upload a photo of your document."
            : "Upload both the front and back of your document.",
      };
    }
    if (!isAcceptedImage(value.type)) {
      return { ok: false, message: "Upload a JPEG, PNG or WebP image." };
    }
    if (value.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        message: `Each image must be under ${humanBytes(MAX_UPLOAD_BYTES)}.`,
      };
    }
    files.push({ kind: kinds[i], file: value });
  }

  try {
    const open = await prisma.kycSubmission.findFirst({
      where: { userId, status: "PENDING" },
      select: { id: true },
    });
    if (open) {
      return {
        ok: false,
        message: "You already have a submission under review.",
      };
    }

    // Uploaded before the row exists so a stored key is never orphaned by a
    // failed write; an unreferenced object is the cheaper failure.
    const stored = await Promise.all(
      files.map(async ({ kind, file }) => {
        const key = `kyc/${userId}/${randomUUID()}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        await putObject(key, bytes, file.type);
        return {
          kind,
          storageKey: key,
          contentType: file.type,
          byteSize: bytes.byteLength,
        };
      }),
    );

    await prisma.kycSubmission.create({
      data: { userId, documentType, documents: { create: stored } },
    });
  } catch (error) {
    return unexpected("submit-documents", error);
  }

  revalidatePath(KYC_PATH);
  return { ok: true, message: "Documents received." };
}

/**
 * Records the simulated liveness capture. Deliberately named `simulated`
 * everywhere: no anti-spoofing runs, so this proves a capture happened, not
 * that a live person was present.
 */
export async function submitLivenessCapture(
  _prev: KycState,
  formData: FormData,
): Promise<KycState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const file = formData.get("selfie");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Capture a photo to continue." };
  }
  if (!isAcceptedImage(file.type)) {
    return { ok: false, message: "The capture was not a supported image." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "That capture is too large." };
  }

  try {
    const submission = await prisma.kycSubmission.findFirst({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, livenessSimulated: true },
    });
    if (!submission) {
      return { ok: false, message: "Submit your document first." };
    }
    if (submission.livenessSimulated) {
      return { ok: false, message: "This step is already complete." };
    }

    const key = `kyc/${userId}/${randomUUID()}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putObject(key, bytes, file.type);

    await prisma.$transaction([
      prisma.kycDocument.create({
        data: {
          submissionId: submission.id,
          kind: "SELFIE",
          storageKey: key,
          contentType: file.type,
          byteSize: bytes.byteLength,
        },
      }),
      prisma.kycSubmission.update({
        where: { id: submission.id },
        data: { livenessSimulated: true },
      }),
      prisma.notification.create({
        data: {
          userId,
          kind: "SYSTEM",
          title: "Verification submitted",
          body: "Your documents are under review. We'll let you know once a decision is made.",
        },
      }),
    ]);
  } catch (error) {
    return unexpected("submit-liveness", error);
  }

  revalidatePath(KYC_PATH);
  return { ok: true, message: "Verification submitted for review." };
}

/**
 * The manual decision. There is no admin role in the schema yet, so this is
 * invoked deliberately rather than exposed on a review screen — which is
 * precisely why it takes an explicit submission id.
 */
export async function reviewSubmission(
  submissionId: number,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<KycState> {
  try {
    const submission = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, userId: true, status: true },
    });
    if (!submission) return { ok: false, message: "No such submission." };
    if (submission.status !== "PENDING") {
      return { ok: false, message: "That submission is already decided." };
    }

    await prisma.$transaction([
      prisma.kycSubmission.update({
        where: { id: submissionId },
        data: {
          status: decision,
          reviewedAt: new Date(),
          reviewNote: note ?? null,
        },
      }),
      prisma.notification.create({
        data: {
          userId: submission.userId,
          kind: "SECURITY",
          title:
            decision === "APPROVED"
              ? "Identity verified"
              : "Verification not approved",
          body:
            decision === "APPROVED"
              ? "Your identity has been verified. Higher limits are now available."
              : note ?? "Your submission was not approved. You can try again.",
        },
      }),
    ]);
  } catch (error) {
    return unexpected("review", error);
  }

  revalidatePath(KYC_PATH);
  return { ok: true, message: `Submission ${decision.toLowerCase()}.` };
}

/** Surfaced in the UI so nobody assumes documents are in a private bucket. */
export async function getStorageMode(): Promise<"bucket" | "local-dev"> {
  return isObjectStoreConfigured() ? "bucket" : "local-dev";
}
