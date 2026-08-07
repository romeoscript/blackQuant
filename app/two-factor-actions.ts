"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyPassword } from "@/lib/password";
import {
  createTotpSecret,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  provisioningQrSvg,
  provisioningUri,
  verifyTotp,
} from "@/lib/totp";

export type TwoFactorState = { ok: boolean; message: string };

export type TwoFactorStatus = {
  enabled: boolean;
  /** ISO — server actions cannot return a Date to a client component. */
  enabledAt: string | null;
  recoveryCodesRemaining: number;
  hasPassword: boolean;
};

/** A pending enrollment: the secret exists but no code has confirmed it yet. */
export type Enrollment = {
  qrSvg: string;
  uri: string;
  /** Shown so an authenticator can be set up by hand if the QR won't scan. */
  manualKey: string;
};

const TWO_FACTOR_PATH = "/dashboard/2fa";

async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}

function unexpected(scope: string, error: unknown): TwoFactorState {
  console.error(`[2fa:${scope}]`, error);
  return {
    ok: false,
    message: "Something went wrong on our end. Please try again.",
  };
}

const readForm = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

export async function getTwoFactorStatus(): Promise<TwoFactorStatus | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabledAt: true,
      passwordHash: true,
      _count: { select: { recoveryCodes: { where: { usedAt: null } } } },
    },
  });
  if (!user) return null;

  return {
    enabled: user.twoFactorEnabledAt !== null,
    enabledAt: user.twoFactorEnabledAt?.toISOString() ?? null,
    recoveryCodesRemaining: user._count.recoveryCodes,
    hasPassword: user.passwordHash !== null,
  };
}

/**
 * Mints a fresh secret and returns the provisioning material. The secret is
 * stored immediately but stays inert until `confirmTwoFactor` proves the user
 * can generate a code from it.
 */
export async function beginTwoFactorEnrollment(): Promise<Enrollment | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, twoFactorEnabledAt: true },
  });
  // Re-enrolling while enabled would silently invalidate the working
  // authenticator, so it has to be disabled first.
  if (!user || user.twoFactorEnabledAt) return null;

  const secret = createTotpSecret();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptSecret(secret) },
    });
  } catch (error) {
    console.error("[2fa:begin]", error);
    return null;
  }

  return {
    qrSvg: provisioningQrSvg(secret, user.email),
    uri: provisioningUri(secret, user.email),
    manualKey: secret,
  };
}

/**
 * Confirms enrollment and returns the recovery codes. They are shown exactly
 * once — only digests are kept — so the caller must surface them immediately.
 */
export async function confirmTwoFactorEnrollment(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState & { recoveryCodes?: string[] }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  const token = readForm(formData, "token");

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabledAt: true },
    });
    if (!user?.twoFactorSecret) {
      return { ok: false, message: "Start the setup again to get a new code." };
    }
    if (user.twoFactorEnabledAt) {
      return { ok: false, message: "Auth Guard is already enabled." };
    }

    const secret = decryptSecret(user.twoFactorSecret);
    if (!secret) {
      return {
        ok: false,
        message: "We couldn't read your setup key. Start the setup again.",
      };
    }
    if (!verifyTotp(secret, token)) {
      return { ok: false, message: "That code isn't right. Try the current one." };
    }

    const codes = generateRecoveryCodes();
    await prisma.$transaction([
      prisma.recoveryCode.deleteMany({ where: { userId } }),
      prisma.recoveryCode.createMany({
        data: codes.map((code) => ({ userId, codeHash: hashRecoveryCode(code) })),
      }),
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabledAt: new Date() },
      }),
      prisma.notification.create({
        data: {
          userId,
          kind: "SECURITY",
          title: "Auth Guard enabled",
          body: "Two-factor authentication is now required to sign in to your account.",
        },
      }),
    ]);

    revalidatePath(TWO_FACTOR_PATH);
    revalidatePath("/dashboard/profile");
    return { ok: true, message: "Auth Guard is on.", recoveryCodes: codes };
  } catch (error) {
    return unexpected("confirm", error);
  }
}

/** Turning protection off is itself a sensitive action, so it needs the password. */
export async function disableTwoFactor(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
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
      return { ok: false, message: "This account has no password to confirm with." };
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return { ok: false, message: "That password is incorrect." };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: null, twoFactorEnabledAt: null },
      }),
      prisma.recoveryCode.deleteMany({ where: { userId } }),
      prisma.notification.create({
        data: {
          userId,
          kind: "SECURITY",
          title: "Auth Guard disabled",
          body: "Two-factor authentication was turned off. If this wasn't you, re-enable it and change your password.",
        },
      }),
    ]);
  } catch (error) {
    return unexpected("disable", error);
  }

  revalidatePath(TWO_FACTOR_PATH);
  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Auth Guard is off." };
}

/** Replaces every unused recovery code; the old ones stop working immediately. */
export async function regenerateRecoveryCodes(): Promise<
  TwoFactorState & { recoveryCodes?: string[] }
> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Your session has expired." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabledAt: true },
    });
    if (!user?.twoFactorEnabledAt) {
      return { ok: false, message: "Auth Guard isn't enabled." };
    }

    const codes = generateRecoveryCodes();
    await prisma.$transaction([
      prisma.recoveryCode.deleteMany({ where: { userId } }),
      prisma.recoveryCode.createMany({
        data: codes.map((code) => ({ userId, codeHash: hashRecoveryCode(code) })),
      }),
    ]);

    revalidatePath(TWO_FACTOR_PATH);
    return { ok: true, message: "New recovery codes generated.", recoveryCodes: codes };
  } catch (error) {
    return unexpected("regenerate", error);
  }
}
