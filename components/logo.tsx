import { cn } from "@/lib/utils";

/**
 * BlackQuant brand mark — three ascending signal bars capped by a live node,
 * in the brand mint, on a dark rounded tile. Scales from favicon to hero.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label="BlackQuant"
    >
      <defs>
        <linearGradient id="bq-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14181a" />
          <stop offset="1" stopColor="#070707" />
        </linearGradient>
        <linearGradient id="bq-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#00e5aa" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8.5"
        fill="url(#bq-tile)"
        stroke="#00e5aa"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <rect x="8.5" y="17" width="3" height="6.5" rx="1.3" fill="#fff" fillOpacity="0.34" />
      <rect x="14.5" y="12.5" width="3" height="11" rx="1.3" fill="#fff" fillOpacity="0.58" />
      <rect x="20.5" y="8.5" width="3" height="15" rx="1.3" fill="url(#bq-bar)" />
      <circle cx="22" cy="8.5" r="3.8" fill="#00e5aa" fillOpacity="0.18" />
      <circle cx="22" cy="8.5" r="2" fill="#00e5aa" />
    </svg>
  );
}

/** Mark + wordmark lockup. Pass `wordmark={false}` for the mark alone. */
export function Logo({
  className,
  markClassName,
  textClassName,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {wordmark && (
        <span className={cn("text-[18px] font-bold tracking-tight text-white", textClassName)}>
          BlackQuant
        </span>
      )}
    </span>
  );
}
