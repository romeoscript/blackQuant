"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store";
import type { AuthStatus } from "@/types";

/**
 * Bridges the NextAuth session into the global Zustand user store so that
 * client components can read the current user from `useUserStore` without
 * each calling `useSession()` themselves. Renders nothing.
 */
export function SessionStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    setUser(session?.user ?? null, status as AuthStatus);
  }, [session, status, setUser]);

  return null;
}
