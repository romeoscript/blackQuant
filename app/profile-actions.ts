"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { deleteObject, putObject } from "@/lib/storage";
import { humanBytes } from "@/lib/utils";
import {
  MAX_AVATAR_BYTES,
  avatarExtension,
  avatarUrl,
  isAcceptedAvatar,
} from "@/lib/avatar";
import {
  notificationPreferenceKeySchema,
  profileSchema,
  type NotificationPreferenceKey,
  type Profile,
} from "@/lib/profile";

export type ProfileState = { ok: boolean; message: string };

const PROFILE_PATH = "/dashboard/profile";

function unexpected(scope: string, error: unknown): ProfileState {
  console.error(`[profile:${scope}]`, error);
  return {
    ok: false,
    message: "Something went wrong on our end. Please try again.",
  };
}

const readForm = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function getProfile(): Promise<Profile | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      username: true,
      phone: true,
      country: true,
      currency: true,
      image: true,
      avatarKey: true,
      createdAt: true,
      passwordChangedAt: true,
      notifySignals: true,
      notifyPositions: true,
      notifyWithdrawals: true,
      notifyReferrals: true,
    },
  });
  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    country: user.country,
    currency: user.currency,
    avatarUrl: avatarUrl(user),
    avatarUploaded: user.avatarKey !== null,
    memberSince: user.createdAt.toISOString(),
    passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
    preferences: {
      notifySignals: user.notifySignals,
      notifyPositions: user.notifyPositions,
      notifyWithdrawals: user.notifyWithdrawals,
      notifyReferrals: user.notifyReferrals,
    },
  };
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const parsed = profileSchema.safeParse({
    name: readForm(formData, "name"),
    username: readForm(formData, "username"),
    phone: readForm(formData, "phone"),
    country: readForm(formData, "country"),
    currency: readForm(formData, "currency"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: parsed.data });
  } catch (error) {
    // The unique index on username is the check — a findFirst beforehand would
    // be a read-then-write race between two accounts claiming the same handle.
    if (isUniqueViolation(error)) {
      return { ok: false, message: "That username is already taken." };
    }
    return unexpected("update", error);
  }

  revalidatePath(PROFILE_PATH);
  return { ok: true, message: "Profile updated." };
}

/** What the topbar and the mobile drawer draw, or null for the initials. */
export async function getAvatarUrl(): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, avatarKey: true },
  });
  return avatarUrl(user);
}

/**
 * Stores a new profile picture. Takes the form data directly rather than the
 * `(prevState, formData)` shape the edit form uses: the picked file is resized
 * in the browser first, so this is called from a handler and never wired
 * straight to a `<form action>`.
 *
 * The browser downscales before sending, so what arrives is normally a few tens
 * of kilobytes — but the type and size are checked here regardless, because the
 * `accept` attribute is only a hint to the file picker and anything at all can
 * be posted to a server action.
 */
export async function updateAvatar(formData: FormData): Promise<ProfileState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }
  const extension = avatarExtension(file.type);
  if (!extension || !isAcceptedAvatar(file.type)) {
    return { ok: false, message: "Upload a JPEG, PNG or WebP image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      message: `That image is over ${humanBytes(MAX_AVATAR_BYTES)}.`,
    };
  }

  let previousKey: string | null = null;
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });
    previousKey = current?.avatarKey ?? null;

    // Stored before the row is pointed at it: an object nobody references is a
    // cheaper failure than a row referencing an object that was never written.
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;
    await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
    await prisma.user.update({ where: { id: userId }, data: { avatarKey: key } });
  } catch (error) {
    return unexpected("avatar", error);
  }

  // Only once the new key is committed, so a failure above leaves the old
  // picture intact rather than leaving the account with none.
  if (previousKey) await deleteObject(previousKey);

  revalidatePath(PROFILE_PATH);
  return { ok: true, message: "Profile picture updated." };
}

/** Drops the upload. An OAuth provider's picture, if any, shows again. */
export async function removeAvatar(): Promise<ProfileState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  let removedKey: string | null = null;
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });
    if (!current?.avatarKey) {
      return { ok: false, message: "There's no picture to remove." };
    }
    removedKey = current.avatarKey;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null },
    });
  } catch (error) {
    return unexpected("avatar-remove", error);
  }

  await deleteObject(removedKey);

  revalidatePath(PROFILE_PATH);
  return { ok: true, message: "Profile picture removed." };
}

/**
 * Everything this account holds, as JSON. Deliberately assembled field by field
 * rather than spreading the row, so a column added later is never exported
 * without someone deciding it should be.
 */
export async function exportAccountData(): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      username: true,
      phone: true,
      country: true,
      currency: true,
      emailVerified: true,
      createdAt: true,
      passwordChangedAt: true,
      notifySignals: true,
      notifyPositions: true,
      notifyWithdrawals: true,
      notifyReferrals: true,
      notifications: {
        select: { kind: true, title: true, body: true, createdAt: true, readAt: true },
        orderBy: { createdAt: "desc" },
      },
      accounts: { select: { provider: true } },
    },
  });
  if (!user) return null;

  return JSON.stringify({ exportedAt: new Date().toISOString(), account: user }, null, 2);
}

/**
 * Removes the account. The password check is the confirmation — a click alone
 * should not be able to destroy an account. Every owned row goes with it via
 * `onDelete: Cascade`.
 */
export async function deleteAccount(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const password = readForm(formData, "password");
  if (!password) return { ok: false, message: "Enter your password to confirm." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      return {
        ok: false,
        message:
          "This account signs in through a provider, so there is no password to confirm with. Contact support to close it.",
      };
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return { ok: false, message: "That password is incorrect." };
    }

    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    return unexpected("delete", error);
  }

  return { ok: true, message: "Your account has been deleted." };
}

export async function setNotificationPreference(
  key: NotificationPreferenceKey,
  enabled: boolean,
): Promise<ProfileState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  // The key names a column, so it is validated against the allow-list rather
  // than interpolated from whatever the client sent.
  const parsedKey = notificationPreferenceKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return { ok: false, message: "Unknown preference." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { [parsedKey.data]: z.boolean().parse(enabled) },
    });
  } catch (error) {
    return unexpected("preference", error);
  }

  revalidatePath(PROFILE_PATH);
  return { ok: true, message: "Preference saved." };
}
