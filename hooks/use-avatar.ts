"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvatarUrl } from "@/app/profile-actions";

/** The query key, so an upload can invalidate what the chrome is showing. */
export const AVATAR_QUERY_KEY = ["avatar"] as const;

/**
 * The current account's picture for the dashboard chrome.
 *
 * Read from the database rather than from `session.user.image`: the session is
 * a JWT minted at sign-in, so a picture uploaded afterwards would not appear in
 * it until the next login.
 *
 * Undefined until it resolves — callers fall back to initials, which is what a
 * picture-less account shows anyway, so there is no flash of the wrong thing.
 */
export function useAvatar(): string | null {
  const { data } = useQuery({
    queryKey: AVATAR_QUERY_KEY,
    queryFn: () => getAvatarUrl(),
  });
  return data ?? null;
}
