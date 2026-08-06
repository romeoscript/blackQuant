import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Shape of `session.user` returned by `auth()` and `useSession()`.
   * Extends the default with the database user id.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    /**
     * Set by the Credentials provider from the sign-in form. Read once, in the
     * `jwt` callback, to decide how long the session should live.
     */
    rememberMe?: boolean;
  }
}

// Augments @auth/core/jwt rather than next-auth/jwt: the interface is declared
// there and next-auth only re-exports it, so augmenting the re-export does not
// merge and the field stays `unknown` at every call site.
declare module "@auth/core/jwt" {
  interface JWT {
    /**
     * Absolute expiry in epoch ms. The session cookie is issued for the longest
     * lifetime we ever grant, so this is what actually ends a session that was
     * not marked "remember me".
     */
    expiresAt?: number;
  }
}
