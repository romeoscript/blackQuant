"use client";

import { useEffect } from "react";

/** Where every successful sign-in lands. */
export const POST_AUTH_DESTINATION = "/dashboard";

/**
 * Leaves for the app once an auth action reports success.
 *
 * Deliberately a full page load rather than a router push: the root layout
 * resolves the session once per load and hands it to SessionProvider, which
 * only reads that prop as initial state. A client-side navigation would keep
 * the provider on the null it read before signing in, leaving the whole app
 * convinced nobody is logged in until the next refresh.
 */
export function useAuthRedirect(succeeded: boolean) {
  useEffect(() => {
    if (succeeded) window.location.assign(POST_AUTH_DESTINATION);
  }, [succeeded]);
}
