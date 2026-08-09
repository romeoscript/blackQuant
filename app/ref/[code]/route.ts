import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  normaliseReferralCode,
} from "@/lib/referral";

/**
 * Where a referral link lands.
 *
 * A route handler rather than a page because the only thing it does is set a
 * cookie, and a Server Component cannot: attribution has to survive the visitor
 * reading the site and signing up later, which a query parameter carried
 * through one navigation would not.
 *
 * The code is remembered, never trusted — whether it belongs to an account is
 * decided at signup, against the database.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const code = normaliseReferralCode((await params).code);

  if (code) {
    const store = await cookies();
    store.set(REFERRAL_COOKIE, code, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      // Read only on the server, at signup. Nothing in the browser needs it.
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  // A bad code still lands on signup rather than a 404: the visitor did nothing
  // wrong, and the worst case is an unattributed account.
  redirect("/signup");
}
