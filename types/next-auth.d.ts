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
}
