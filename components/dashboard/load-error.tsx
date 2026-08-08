"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown in place of a panel whose data failed to load.
 *
 * Deliberately takes the panel's space rather than sitting above it as a
 * banner: a figure rendered next to an error is still read as a figure, and on
 * a screen about money the wrong number is worse than no number.
 */
export function LoadError({
  message = "We couldn't load this right now.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-bq-loss/40 bg-bq-loss/[0.04] px-5 py-10 text-center",
        className,
      )}
    >
      <TriangleAlert className="size-5 text-bq-loss-text" />
      <p className="text-[13px] text-bq-text">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-bq-border px-3 py-1.5 text-[12px] font-medium text-bq-heading transition-colors hover:bg-bq-surface"
        >
          <RotateCw className="size-3.5" /> Try again
        </button>
      )}
    </div>
  );
}
