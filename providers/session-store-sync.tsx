"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store";
import type { AuthStatus } from "@/types";


export function SessionStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    setUser(session?.user ?? null, status as AuthStatus);
  }, [session, status, setUser]);

  return null;
}
