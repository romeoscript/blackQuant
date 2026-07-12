"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { SessionStoreSync } from "./session-store-sync";

/**
 * Root client providers. Wrap the app once in the root layout.
 * `session` is the server-resolved session, passed through so the client
 * doesn't need an extra round-trip to hydrate auth state.
 */
export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <ThemeProvider>
          <SmoothScrollProvider>
            <SessionStoreSync />
            {children}
          </SmoothScrollProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
