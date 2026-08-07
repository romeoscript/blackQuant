import NextAuth from "next-auth";
import credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { decryptSecret, hashRecoveryCode, verifyTotp } from "@/lib/totp";
import authConfig from "./auth.config";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  // Arrives as a string because credentials cross the wire as form values.
  // Must accept "false" as well as "true": a literal("true") schema rejects the
  // unchecked case outright, which fails the whole sign-in.
  remember: z.enum(["true", "false"]).optional(),
  /** A TOTP code or a recovery code; empty when the account has no 2FA. */
  twoFactor: z.string().optional(),
});

/**
 * Spends a recovery code if `token` matches an unused one. Marking it used in
 * the same statement that selects it is what stops the same code authenticating
 * twice from two concurrent attempts.
 */
async function consumeRecoveryCode(
  userId: number,
  token: string,
): Promise<boolean> {
  const candidate = await prisma.recoveryCode.findFirst({
    where: { userId, usedAt: null, codeHash: hashRecoveryCode(token) },
    select: { id: true },
  });
  if (!candidate) return false;

  const spent = await prisma.recoveryCode.updateMany({
    where: { id: candidate.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return spent.count === 1;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "checkbox" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        // A lookup failure is not a wrong password. Auth.js turns any throw
        // here into a generic sign-in failure, which is the right thing to
        // show the user — but the real cause has to reach the server log or an
        // outage is indistinguishable from bad credentials.
        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
        } catch (error) {
          console.error("[auth:authorize]", error);
          throw error;
        }

        // An OAuth-only account has no digest to compare against. Returning
        // null (rather than a distinct error) keeps the response identical to
        // a wrong password, so this cannot be used to enumerate accounts.
        if (!user?.passwordHash) return null;
        if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
          return null;
        }

        // Enforced here rather than only in the sign-in action, so a caller
        // that invokes signIn directly still cannot skip the second factor.
        if (user.twoFactorEnabledAt) {
          const token = parsed.data.twoFactor?.trim() ?? "";
          if (!token) return null;

          const secret = user.twoFactorSecret
            ? decryptSecret(user.twoFactorSecret)
            : null;
          const accepted =
            (secret !== null && verifyTotp(secret, token)) ||
            (await consumeRecoveryCode(user.id, token));
          if (!accepted) return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe: parsed.data.remember === "true",
        };
      },
    }),
  ],
});
