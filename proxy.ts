// Next.js 16 renamed the "middleware" convention to "proxy".
//
// This builds its own NextAuth instance from the edge-safe half of the config:
// importing the one in `auth.ts` would drag the Prisma adapter and the
// Credentials provider's Node crypto into the edge bundle.
import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Assigned in two steps: Next resolves the `proxy` export statically and does
// not see it through a destructuring pattern.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  // Run on everything except Next internals, static files, and auth API routes.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
