import { cn } from "@/lib/utils";

/**
 * BlackQuant brand mark — a "Quant" Q: a precision ring cut by a single tail.
 * Flat, monochrome mint, no container, so it reads as a logo on any surface.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-8 shrink-0", className)}
      fill="none"
      stroke="#00e5aa"
      strokeWidth="8"
      role="img"
      aria-label="BlackQuant"
    >
      <circle cx="48" cy="48" r="30" />
      <line x1="60" y1="60" x2="82" y2="82" strokeLinecap="round" />
    </svg>
  );
}
