import type { NextAuthConfig } from "next-auth";
import github from "next-auth/providers/github";
import google from "next-auth/providers/google";

const DAY_SECONDS = 24 * 60 * 60;
/** Lifetime granted when "remember me" is ticked, matching the form's label. */
export const REMEMBERED_SESSION_SECONDS = 30 * DAY_SECONDS;
/** Lifetime otherwise. Short, but a JWT cannot expire on browser close. */
export const DEFAULT_SESSION_SECONDS = DAY_SECONDS;

/** Routes that require a session; everything else on the site is public. */
const PROTECTED_PREFIXES = ["/dashboard"];
/** Signed-in users have no reason to see these, so they bounce to the app. */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default {
  providers: [
    ...(process.env.AUTH_GOOGLE_ID ? [google] : []),
    ...(process.env.AUTH_GITHUB_ID ? [github] : []),
  ],
  // Both NextAuth instances read this, so the proxy validates tokens against
  // the same window the handlers issue them with. The cookie is always given
  // the longest lifetime we grant; `expiresAt` inside the token is what ends a
  // session early.
  session: { strategy: "jwt", maxAge: REMEMBERED_SESSION_SECONDS },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isSignedIn = Boolean(auth?.user);

      if (startsWithAny(pathname, PROTECTED_PREFIXES)) return isSignedIn;
      if (isSignedIn && AUTH_PAGES.includes(pathname)) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      // `user` is only present on the sign-in pass; persist the id so every
      // later request can read it without a database round-trip, and stamp the
      // lifetime this particular sign-in asked for.
      if (user) {
        token.sub = String(user.id);
        token.expiresAt =
          Date.now() +
          (user.rememberMe
            ? REMEMBERED_SESSION_SECONDS
            : DEFAULT_SESSION_SECONDS) *
            1000;
      }

      // Returning null clears the session. Tokens minted before this field
      // existed carry none, so only enforce it when it is set.
      if (token.expiresAt && Date.now() > token.expiresAt) return null;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
