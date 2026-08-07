"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyPassword } from "@/lib/password";
import {
  notificationPreferenceKeySchema,
  profileSchema,
  type NotificationPreferenceKey,
  type Profile,
} from "@/lib/profile";

export type ProfileState = { ok: boolean; message: string };

const PROFILE_PATH = "/dashboard/profile";

/**
 * The signed-in user's id, or null. Every query below scopes on this rather
 * than on anything the caller passes, so one account can never edit another's.
 */
async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}

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
