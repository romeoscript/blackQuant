// Next.js 16 renamed the "middleware" convention to "proxy".
// NextAuth's `auth` handler doubles as the proxy/middleware function.
export { auth as proxy } from "@/auth";

export const config = {
  // Run on everything except Next internals, static files, and auth API routes.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
