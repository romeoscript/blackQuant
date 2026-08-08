import { cn } from "@/lib/utils";

/**
 * The account's picture, or its initials when there is none. Shared by the
 * topbar, the mobile drawer and the profile header so the three cannot drift
 * on shape, fallback or how a missing image behaves.
 *
 * Size, radius and text size come from the caller — every place it appears is
 * a different one.
 */
export function Avatar({
  src,
  initials,
  className,
}: {
  src: string | null;
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 font-bold text-primary",
        className,
      )}
    >
      {src ? (
        // Not next/image: the source is either our own route or an OAuth
        // provider's CDN, and the provider hosts are not known ahead of time to
        // be listed in `remotePatterns`. The bytes are already avatar-sized.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
