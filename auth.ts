import NextAuth from "next-auth";
import credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import authConfig from "./auth.config";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  // Arrives as a string because credentials cross the wire as form values.
  // Must accept "false" as well as "true": a literal("true") schema rejects the
  // unchecked case outright, which fails the whole sign-in.
  remember: z.enum(["true", "false"]).optional(),
});

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
