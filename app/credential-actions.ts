"use server";

import { createHash, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import {
  CODE_LENGTH,
  CODE_TTL_MINUTES,
  MAX_CODE_ATTEMPTS,
  codeSchema,
  newPasswordSchema,
} from "@/lib/credential-reset";

export type CredentialState = { ok: boolean; message: string };

/** Only the digest is stored, so a leaked table cannot be replayed. */
const digest = (code: string) => createHash("sha256").update(code).digest("hex");

const readForm = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

async function currentUser() {
  const id = await currentUserId();
  if (id === null) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, passwordHash: true },
  });
}

function unexpected(scope: string, error: unknown): CredentialState {
  console.error(`[credentials:${scope}]`, error);
  return {
    ok: false,
    message: "Something went wrong on our end. Please try again.",
  };
}

export type CredentialAccount = {
  email: string;
  emailVerified: boolean;
  /** OAuth-only accounts have nothing to reset here. */
  hasPassword: boolean;
};

export async function getCredentialAccount(): Promise<CredentialAccount | null> {
  const id = await currentUserId();
  if (id === null) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, emailVerified: true, passwordHash: true },
  });
  if (!user) return null;

  return {
    email: user.email,
    emailVerified: user.emailVerified !== null,
    hasPassword: user.passwordHash !== null,
  };
}

/**
 * Mails a fresh step-up code, replacing any outstanding one so only the newest
 * can be used. `randomInt` is the CSPRNG — `Math.random` would make the code
 * predictable from other codes.
 */
export async function sendCredentialResetCode(): Promise<CredentialState> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");

  try {
    await prisma.$transaction([
      prisma.credentialResetCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.credentialResetCode.create({
        data: {
          userId: user.id,
          codeHash: digest(code),
          expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
        },
      }),
    ]);
  } catch (error) {
    return unexpected("send-code", error);
  }

  try {
    await sendMail({
      to: user.email,
      subject: `Your BlackQuant verification code: ${code}`,
      body:
        `Use this code to change your BlackQuant credentials:\n\n${code}\n\n` +
        `It expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, ` +
        `someone may have access to your account — change your password immediately.`,
    });
  } catch {
    return {
      ok: false,
      message: "We couldn't send the email just now. Please try again shortly.",
    };
  }

  return { ok: true, message: "Verification code sent." };
}

/**
 * Checks a code without consuming it, so the wizard can gate its second step.
 * The code is spent only when the password actually changes.
 */
export async function verifyCredentialResetCode(
  _prev: CredentialState,
  formData: FormData,
): Promise<CredentialState> {
  const parsed = codeSchema.safeParse(readForm(formData, "code"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const user = await currentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  try {
    return await consumeAttempt(user.id, parsed.data);
  } catch (error) {
    return unexpected("verify-code", error);
  }
}

/** Verifies the code one final time, then replaces the password. */
export async function changePassword(
  _prev: CredentialState,
  formData: FormData,
): Promise<CredentialState> {
  const parsed = newPasswordSchema.safeParse({
    code: readForm(formData, "code"),
    password: readForm(formData, "password"),
    confirm: readForm(formData, "confirm"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const user = await currentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  try {
    const grant = await consumeAttempt(user.id, parsed.data.code);
    if (!grant.ok) return grant;

    const passwordHash = await hashPassword(parsed.data.password);
    // One transaction so the code cannot be spent without the password
    // changing, and every outstanding emailed reset link dies with it.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      prisma.credentialResetCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          kind: "SECURITY",
          title: "Password changed",
          body: "Your account password was changed from the dashboard. If this wasn't you, contact support immediately.",
        },
      }),
    ]);
  } catch (error) {
    return unexpected("change-password", error);
  }

  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Your password has been changed." };
}

/**
 * Matches `code` against the user's outstanding row, counting the attempt.
 * Looking the row up by user rather than by hash is what lets a wrong guess be
 * recorded at all — a hash lookup would simply miss and leave no trace.
 */
async function consumeAttempt(
  userId: number,
  code: string,
): Promise<CredentialState> {
  const expired = {
    ok: false,
    message: "That code has expired. Request a new one.",
  };

  const row = await prisma.credentialResetCode.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return expired;

  if (row.codeHash === digest(code)) return { ok: true, message: "" };

  const attempts = row.attempts + 1;
  const burned = attempts >= MAX_CODE_ATTEMPTS;
  await prisma.credentialResetCode.update({
    where: { id: row.id },
    data: { attempts, usedAt: burned ? new Date() : null },
  });

  if (burned) {
    return {
      ok: false,
      message: "Too many incorrect attempts. Request a new code.",
    };
  }
  return {
    ok: false,
    message: `Incorrect code. ${MAX_CODE_ATTEMPTS - attempts} attempts remaining.`,
  };
}
