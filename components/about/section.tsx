import { cn } from "@/lib/utils";

/**
 * The eyebrow used by most About sections — a green rule beside a mono caption.
 * The landing page uses a pill eyebrow instead; this page's design calls for
 * the bar, so it lives here rather than in the shared landing components.
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-1 rounded-full bg-bq-green md:h-4" />
      <span className="font-plex text-[10px] uppercase tracking-[1px] text-bq-muted">
        {children}
      </span>
    </div>
  );
}

/** Full-bleed rule + the page's content column, shared by every About section. */
export function AboutSection({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-b border-bq-border-soft bg-bq-bg px-6 py-10 sm:px-8 md:px-16",
        className,
      )}
    >
      <div className="mx-auto max-w-[1312px]">
        {label && <SectionLabel>{label}</SectionLabel>}
        <div className={cn(label && "mt-7 md:mt-8")}>{children}</div>
      </div>
    </section>
  );
}

export function AboutCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-bq-border bg-bq-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
