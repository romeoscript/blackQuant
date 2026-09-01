import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

/**
 * The chrome and banding shared by the standalone marketing pages.
 *
 * The shell below was already written out three times (About, the legal pages,
 * the blog) before these pages were added; a fourth, fifth and sixth copy is
 * where a page quietly ends up missing the scroll indicator or the assistant.
 * The existing three are deliberately left as they are — this is for the pages
 * being added, not a refactor of the ones that work.
 */

/** Band padding. Matches the legal pages and the blog so the rhythm carries across. */
export const PAD = "px-6 sm:px-8 md:px-16";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />
      {children}
      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}

/**
 * Centred page opener: eyebrow pill, title, standfirst.
 *
 * `pt-[87px]` clears the fixed nav — the header is absolutely positioned, so
 * without it the first line of every page sits underneath the logo.
 */
export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-bq-bg pt-[87px]", PAD)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--bq-green) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-5 py-14 text-center md:py-20">
        <span className="flex items-center gap-2 rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-4 py-1.5">
          <Icon className="size-3 text-bq-green" />
          <span className="text-[11px] font-bold text-bq-green">{eyebrow}</span>
        </span>
        <h1 className="font-satoshi text-[28px] font-bold leading-[1.25] tracking-tight text-bq-heading md:text-[48px]">
          {title}
        </h1>
        <p className="text-[13px] leading-[1.63] text-bq-muted md:text-[18px]">
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  );
}

/** A content band. `divider` draws the hairline that separates stacked bands. */
export function Band({
  children,
  className,
  divider = false,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
  width?: "wide" | "narrow";
}) {
  return (
    <section
      className={cn(
        "bg-bq-bg py-12 md:py-16",
        divider && "border-t border-bq-border",
        PAD,
        className,
      )}
    >
      <div
        className={cn("mx-auto", width === "narrow" ? "max-w-[768px]" : "max-w-[1040px]")}
      >
        {children}
      </div>
    </section>
  );
}

export function BandHeading({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[26px]">
        {children}
      </h2>
      {sub && <p className="max-w-[620px] text-[13px] leading-[1.7] text-bq-muted">{sub}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-2xl border border-bq-border bg-bq-card p-5 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
