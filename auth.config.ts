import type { NextAuthConfig } from "next-auth";
import github from "next-auth/providers/github";
import google from "next-auth/providers/google";

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

      if (user) token.sub = String(user.id);
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
