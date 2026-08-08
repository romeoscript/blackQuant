import { auth } from "@/auth";

/**
 * The signed-in user's id, or null.
 *
 * Every query in the application scopes on this rather than on anything a
 * caller passes, so it is the authorization boundary — which is why it lives
 * in one place. The `Number.isInteger` check is load-bearing: `Number("")` is
 * 0 and `Number(undefined)` is NaN, and a row id of 0 or NaN must never reach
 * a `where` clause.
 */
export async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) ? id : null;
}
