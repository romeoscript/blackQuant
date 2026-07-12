import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AuthUser, AuthStatus } from "@/types";

interface UserState {
  user: AuthUser | null;
  status: AuthStatus;
  /** Replace the current user + status. Called by the session sync bridge. */
  setUser: (user: AuthUser | null, status: AuthStatus) => void;
  clear: () => void;
}

/**
 * Global client-side user store. Kept in sync with the NextAuth session by
 * `SessionStoreSync` (see providers), so any client component can read the
 * current user without prop drilling or its own `useSession()` call.
 */
export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      user: null,
      status: "loading",
      setUser: (user, status) => set({ user, status }, false, "setUser"),
      clear: () =>
        set({ user: null, status: "unauthenticated" }, false, "clear"),
    }),
    { name: "user-store" },
  ),
);

/** Selector helpers to avoid re-render churn from selecting the whole store. */
export const selectUser = (s: UserState) => s.user;
export const selectStatus = (s: UserState) => s.status;
export const selectIsAuthenticated = (s: UserState) =>
  s.status === "authenticated" && s.user !== null;
