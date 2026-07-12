"use client";

import {
  useUserStore,
  selectUser,
  selectStatus,
  selectIsAuthenticated,
} from "@/store";

/**
 * Read the current user from the global store in any client component.
 *
 * @example
 * const { user, isAuthenticated } = useUser();
 */
export function useUser() {
  const user = useUserStore(selectUser);
  const status = useUserStore(selectStatus);
  const isAuthenticated = useUserStore(selectIsAuthenticated);

  return {
    user,
    status,
    isAuthenticated,
    isLoading: status === "loading",
  };
}
