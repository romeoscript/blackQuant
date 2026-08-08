"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Everything that a deposit moving makes stale. */
const AFFECTED = [
  ["deposits"],
  ["balance"],
  ["treasury"],
  ["control-center"],
  ["notifications"],
] as const;

/**
 * Opens the deposit event stream and refetches what a deposit invalidates.
 *
 * Mounted once for the whole dashboard, so a tab holds one connection rather
 * than one per card. The message itself is only a signal — the data is refetched
 * through the normal authenticated queries, so nothing here has to be trusted.
 *
 * Screens keep their slow polling underneath this. A stream can be buffered by
 * a proxy or dropped without either end noticing, and a balance that stops
 * updating is worse than one that updates a minute late.
 */
export function useDepositStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Same-origin, so the session cookie rides along; EventSource cannot set
    // headers, which is exactly why this endpoint authenticates by cookie.
    const source = new EventSource("/api/deposit/stream");

    const refresh = () => {
      for (const queryKey of AFFECTED) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    source.addEventListener("deposit", refresh);

    // EventSource reconnects on its own after a network drop; a non-200 (an
    // expired session, say) closes it for good, and the polling fallback is
    // what covers that.
    source.addEventListener("error", () => {
      if (source.readyState === EventSource.CLOSED) {
        console.warn("[deposit:stream] closed — falling back to polling");
      }
    });

    return () => source.close();
  }, [queryClient]);
}
