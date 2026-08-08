"use server";

import { createHash, randomBytes } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signIn } from "@/auth";

export type AuthState = {
  ok: boolean;
  message: string;
  /** The password was right but the account needs its second factor. */
  needsTwoFactor?: boolean;
};

/** Matches the 15 minutes the forgot-password screen promises. */
const RESET_TOKEN_TTL_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 8;

const passwordField = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  );

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.email("Enter a valid email address"),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const resetSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid"),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

/** Only the digest is persisted, so a leaked table cannot be replayed. */
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const readForm = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

/**
 * Last resort for a database call that failed in a way the flow does not model
 * — a dropped connection, a stale generated client, a constraint we did not
 * anticipate. The cause is logged for the server; the caller sees nothing that
 * describes our internals.
 */
function unexpected(scope: string, error: unknown): AuthState {
  console.error(`[auth:${scope}]`, error);
  return {
    ok: false,
    message: "Something went wrong on our end. Please try again.",
  };
}

const firstIssue = (error: z.ZodError) => error.issues[0].message;

/** Creates the account, then signs it in — `signIn` redirects on success. */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    firstName: readForm(formData, "firstName"),
    lastName: readForm(formData, "lastName"),
    email: readForm(formData, "email"),
    password: readForm(formData, "password"),
    confirm: readForm(formData, "confirm"),
  });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const { firstName, lastName, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // The unique index on email is the check. A findUnique first would be a
  // read-then-write race: two concurrent signups both pass, one then dies on
  // the constraint.
  try {
    await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash: await hashPassword(password),
        // Written with the account so the panel is never empty on first login.
        // Nested create shares the insert's transaction: no account can exist
        // without it, and a failure rolls the whole signup back.
        notifications: {
          create: {
            kind: "WELCOME",
            title: "Welcome to BlackQuant",
            body: `You're in, ${firstName}. Fund your account to activate a plan and start receiving live signals.`,
          },
        },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "An account with that email already exists.",
      };
    }
    return unexpected("sign-up", error);
  }

  return signInWithPassword({
    email,
    password,
    failureMessage:
      "Your account is ready, but signing in failed. Try logging in.",
  });
}

/** Signs an existing account in. Redirects to the dashboard on success. */
export async function logIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({
      email: z.email("Enter a valid email address"),
      password: z.string().min(1, "Enter your password"),
    })
    .safeParse({
      email: readForm(formData, "email"),
      password: readForm(formData, "password"),
    });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const email = parsed.data.email.trim().toLowerCase();
  const twoFactor = readForm(formData, "twoFactor").trim();

  // Whether to prompt for a second factor is decided only after the password
  // checks out. Asking based on the address alone would tell an attacker which
  // accounts have 2FA — and confirm the address exists. The cost is one extra
  // hash comparison on a first attempt; `authorize` verifies independently.
  if (!twoFactor) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { passwordHash: true, twoFactorEnabledAt: true },
      });
      if (
        user?.passwordHash &&
        user.twoFactorEnabledAt &&
        (await verifyPassword(parsed.data.password, user.passwordHash))
      ) {
        return { ok: false, message: "", needsTwoFactor: true };
      }
    } catch (error) {
      return unexpected("log-in", error);
    }
  }

  return signInWithPassword({
    email,
    password: parsed.data.password,
    // Deliberately does not distinguish unknown address from wrong password.
    failureMessage: twoFactor
      ? "That code isn't right. Try the current one."
      : "Invalid email or password.",
    remember: readForm(formData, "remember") === "true",
    twoFactor,
  });
}

/**
 * Always reports success. Confirming whether an address has an account would
 * turn this form into an account-enumeration oracle.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const sent = {
    ok: true,
    message: "If that email is registered, a reset link is on its way.",
  };

  const parsed = z
    .email()
    .safeParse(readForm(formData, "email").trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const token = randomBytes(32).toString("base64url");
  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: { id: true },
    });
    if (!user) return sent;

    await prisma.passwordResetToken.create({
      data: {
        tokenHash: digest(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    });
  } catch (error) {
    return unexpected("password-reset-request", error);
  }

  const url = `${env.AUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  try {
    await sendMail({
      to: parsed.data,
      subject: "Reset your BlackQuant password",
      body:
        `Someone asked to reset the password for this account.\n\n${url}\n\n` +
        `The link expires in ${RESET_TOKEN_TTL_MINUTES} minutes and can only be used once. ` +
        `If this wasn't you, no action is needed.`,
    });
  } catch {
    // The token is already stored, so a delivery failure is recoverable by
    // retrying. Report it rather than claiming the mail is on its way.
    return {
      ok: false,
      message: "We couldn't send the email just now. Please try again shortly.",
    };
  }

  return sent;
}

/** Consumes a reset token and replaces the password. */
export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    token: readForm(formData, "token"),
    password: readForm(formData, "password"),
    confirm: readForm(formData, "confirm"),
  });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  let email: string;
  try {
    const grant = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: digest(parsed.data.token) },
      include: { user: { select: { email: true } } },
    });

    if (!grant || grant.usedAt || grant.expiresAt < new Date()) {
      return {
        ok: false,
        message: "This reset link has expired or already been used.",
      };
    }
    email = grant.user.email;

    const passwordHash = await hashPassword(parsed.data.password);
    // One transaction so a token can never be spent without the password
    // changing, and every other outstanding grant dies with it.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: grant.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: grant.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: grant.userId, usedAt: null },
      }),
    ]);
  } catch (error) {
    return unexpected("password-reset", error);
  }

  return signInWithPassword({
    email,
    password: parsed.data.password,
    failureMessage:
      "Your password was changed, but signing in failed. Try logging in.",
  });
}

/**
 * `signIn` reports failure by throwing, and signals its post-login redirect the
 * same way — so framework errors must pass straight through.
 */
async function signInWithPassword({
  email,
  password,
  failureMessage,
  remember = false,
  twoFactor = "",
}: {
  email: string;
  password: string;
  failureMessage: string;
  /** Only the login form offers the choice; the rest take the short session. */
  remember?: boolean;
  twoFactor?: string;
}): Promise<AuthState> {
  try {
    // `redirect: false` so this returns rather than throwing: the caller
    // navigates with a full page load (see useAuthRedirect), which a
    // server-side redirect cannot produce.
    await signIn("credentials", {
      email,
      password,
      remember: String(remember),
      twoFactor,
      redirect: false,
    });
  } catch (error) {
    // Rethrows Next's internal control-flow errors (the post-login redirect);
    // anything else is a genuine sign-in failure.
    unstable_rethrow(error);
    return { ok: false, message: failureMessage };
  }

  return { ok: true, message: "" };
}
