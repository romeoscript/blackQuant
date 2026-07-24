"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * How long the overlay lingers after hydration, so a fast load isn't a jarring
 * flash. The overlay covers real content, so this is paid for directly in
 * Largest Contentful Paint — keep it short. Set to 0 to reclaim it entirely.
 */
const LINGER_MS = 400;

/**
 * Brand overlay shown during the initial page load, rendered from the server so
 * it paints with the first frame rather than appearing after hydration.
 *
 * Dismissal is keyed to hydration, deliberately *not* to `window.load`: `load`
 * waits on every subresource (fonts, images, the odd slow request), which on a
 * throttled connection would park the overlay for seconds and hold LCP back
 * with it. Once React has hydrated, the content underneath is real and
 * interactive — that is the honest "ready" signal. A slow hydration keeps the
 * overlay up for longer on its own, which is exactly the behaviour we want.
 */
export function BrandLoader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), LINGER_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      // `bq-boot` carries the CSS-only failsafe that hides this even if the
      // effect above never runs (JS disabled, hydration error, chunk 404).
      className={cn(
        "bq-boot pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-bq-bg transition-opacity duration-500",
        done && "opacity-0",
      )}
      // Purely decorative: the real content is already in the DOM behind it, so
      // screen readers and crawlers should ignore this entirely.
      aria-hidden
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          viewBox="0 0 100 100"
          className="size-10"
          fill="none"
          stroke="#00e5aa"
          strokeWidth="8"
        >
          <circle
            cx="48"
            cy="48"
            r="30"
            strokeDasharray="150 38"
            strokeLinecap="round"
            style={{
              transformOrigin: "48px 48px",
              animation: "bq-spin-slow 1.1s linear infinite",
            }}
          />
          <line x1="60" y1="60" x2="82" y2="82" strokeLinecap="round" />
        </svg>
        <span className="font-plex text-[10px] uppercase tracking-[3px] text-bq-dim">
          BlackQuant
        </span>
      </div>
    </div>
  );
}
