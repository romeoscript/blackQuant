import type { Session } from "next-auth";

/** The authenticated user as exposed to client components. */
export type AuthUser = Session["user"];

/** Authentication lifecycle status, mirrors next-auth's session states. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
