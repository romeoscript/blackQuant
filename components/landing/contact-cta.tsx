import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CtaAction = {
  icon: LucideIcon;
  label: string;
  /** `mailto:`/`https:` render as a plain anchor; anything else routes via next/link. */
  href: string;
  /** Rendered only from `sm` up, so mobile gets the design's shorter label. */
  prefix?: string;
  primary?: boolean;
};

/** The closing "get in touch" card shared by the About and legal pages. */
export function ContactCta({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: readonly CtaAction[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-bq-border bg-bq-card p-5 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 0% 50%, color-mix(in srgb, var(--bq-green) 5%, transparent), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[21px]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-[540px] text-[11px] leading-[1.43] text-bq-muted md:text-[13px]">
            {body}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {actions.map((action) => (
            <CtaButton key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaButton({ icon: Icon, label, href, prefix, primary }: CtaAction) {
  const className = cn(
    "flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform active:translate-y-px",
    primary
      ? "bg-bq-green text-bq-on-fill hover:bg-bq-green/90"
      : "border border-bq-overlay/[0.12] bg-bq-surface text-bq-text hover:text-bq-heading",
  );
  const content = (
    <>
      <Icon className="size-3.5 shrink-0" />
      {/* One flex child, or the row gap lands between prefix and label. */}
      <span>
        {prefix && <span className="hidden sm:inline">{prefix}</span>}
        {label}
      </span>
    </>
  );

  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className}>
      {content}
    </a>
  );
}
