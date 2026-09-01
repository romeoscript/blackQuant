import { ArrowUpRight, Check, ChevronDown, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyHref, type Role } from "./data";

/**
 * A role listing.
 *
 * The non-featured roles expand with a native `<details>` rather than React
 * state: it is keyboard accessible and open-by-default-in-print for free, it
 * survives a page with no JavaScript, and it keeps the whole careers page a
 * server component.
 */

function Meta({ role }: { role: Role }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-plex text-[10px] uppercase tracking-[1.5px]">
      <span className="rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-2.5 py-1 text-bq-green">
        {role.team}
      </span>
      <span className="rounded-full border border-bq-border bg-bq-overlay/[0.03] px-2.5 py-1 text-bq-muted">
        {role.type}
      </span>
      <span className="flex items-center gap-1.5 text-bq-dim">
        <MapPin className="size-3" />
        {role.location}
      </span>
    </div>
  );
}

function Detail({ role }: { role: Role }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <List title="What you'd own" items={role.responsibilities} />
      <List title="What you'd bring" items={role.requirements} />
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
        {title}
      </h4>
      <ul className="mt-3.5 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check className="mt-0.5 size-3.5 shrink-0 text-bq-green" />
            <span className="text-[13px] leading-[1.65] text-bq-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Compensation({ role }: { role: Role }) {
  return (
    <p className="text-[12px] text-bq-dim">
      <span className="font-plex uppercase tracking-[1.5px]">Compensation</span>
      <span className="mx-2 text-bq-border">|</span>
      <span className="text-bq-text">{role.compensation}</span>
    </p>
  );
}

function ApplyButton({ role, primary }: { role: Role; primary?: boolean }) {
  return (
    <a
      href={applyHref(role)}
      className={cn(
        "flex w-fit shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-colors",
        primary
          ? "bg-bq-contrast text-bq-on-fill hover:opacity-90"
          : "border border-bq-border text-bq-heading hover:border-bq-green/30 hover:text-bq-green",
      )}
    >
      Apply
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}

/** The lead role — always expanded, since it is the one we most want read. */
export function FeaturedRoleCard({ role }: { role: Role }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-bq-green/25 bg-bq-card p-6 md:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 100% 0%, color-mix(in srgb, var(--bq-green) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <span className="flex w-fit items-center gap-2 rounded-full border border-bq-green/20 bg-bq-green/[0.08] px-3 py-1">
          <Sparkles className="size-3 text-bq-green" />
          <span className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-green">
            Priority hire
          </span>
        </span>

        <h3 className="mt-4 font-satoshi text-[24px] font-bold leading-[1.2] tracking-tight text-bq-heading md:text-[34px]">
          {role.title}
        </h3>
        <p className="mt-3 max-w-[640px] text-[14px] leading-[1.7] text-bq-muted md:text-[16px]">
          {role.summary}
        </p>

        <div className="mt-5">
          <Meta role={role} />
        </div>

        <div className="mt-7 border-t border-bq-border-soft pt-7">
          <Detail role={role} />
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-bq-border-soft pt-5">
          <Compensation role={role} />
          <ApplyButton role={role} primary />
        </div>
      </div>
    </div>
  );
}

export function RoleCard({ role }: { role: Role }) {
  return (
    <details className="group rounded-2xl border border-bq-border bg-bq-card transition-colors open:border-bq-green/25 hover:border-bq-green/20">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="font-satoshi text-[17px] font-bold tracking-tight text-bq-heading md:text-[20px]">
            {role.title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-bq-muted">{role.summary}</p>
          <div className="mt-4">
            <Meta role={role} />
          </div>
        </div>
        <ChevronDown
          aria-hidden
          className="mt-1 size-4 shrink-0 text-bq-dim transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-bq-border-soft px-5 pb-5 pt-6 md:px-6 md:pb-6">
        <Detail role={role} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-bq-border-soft pt-5">
          <Compensation role={role} />
          <ApplyButton role={role} />
        </div>
      </div>
    </details>
  );
}
