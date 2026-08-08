"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, CircleDollarSign, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const notify = (label: string) =>
  toast(label, { description: "This action isn't wired up in the demo yet." });

export function HeaderActions() {
  return (
    <>
      <button
        onClick={() => notify("Fund")}
        className="flex items-center gap-2 rounded-lg border border-bq-border px-4 py-2 text-[13px] font-semibold text-bq-heading transition-colors hover:bg-bq-overlay/5"
      >
        <CircleDollarSign className="size-4" /> Fund
      </button>
      <button
        onClick={() => notify("New Position")}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
      >
        <Plus className="size-4" /> New Position
      </button>
    </>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-bq-border bg-bq-surface p-5", className)}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  sub,
  action,
  className,
  children,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-bq-heading">{title}</h2>
          {sub && <p className="text-[12px] text-bq-dim">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  green,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  green?: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-plex text-[10px] uppercase tracking-[1px] text-bq-muted sm:text-[11px]">
          {label}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bq-bg text-bq-muted">
          <Icon className="size-4" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-[26px] font-bold leading-none sm:text-[28px]",
          green ? "text-primary" : "text-bq-heading",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-[12px] text-bq-dim">{sub}</p>}
    </Card>
  );
}

/** Shared badge vocabulary. Exported so domain modules can name a tone
 *  without also owning its Tailwind classes. */
export type Tone = "green" | "red" | "amber" | "white" | "neutral";
export function StatPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const cls: Record<Tone, string> = {
    green: "bg-bq-mint/15 text-bq-mint",
    red: "bg-bq-loss/15 text-bq-loss-text",
    amber: "bg-bq-warn/15 text-bq-warn-text",
    white: "bg-bq-overlay/10 text-bq-heading",
    neutral: "bg-bq-overlay/[0.06] text-bq-muted",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", cls[tone])}>
      {children}
    </span>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
              i <= current ? "bg-primary text-primary-foreground" : "bg-bq-bg text-bq-dim",
            )}
          >
            {i + 1}
          </span>
          <span
            className={cn(
              "ml-2 whitespace-nowrap text-[13px]",
              i === current ? "font-medium text-bq-heading" : "text-bq-dim",
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <span className={cn("mx-3 hidden h-px flex-1 sm:block", i < current ? "bg-primary" : "bg-bq-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

export function Toggle({
  defaultOn = false,
  onToggle,
  disabled = false,
  label,
}: {
  defaultOn?: boolean;
  /** Omit to keep the switch purely visual, as the fixture-backed screens do. */
  onToggle?: (on: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        const next = !on;
        setOn(next);
        onToggle?.(next);
      }}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-bq-border",
      )}
    >
      <span
        className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")}
      />
    </button>
  );
}

type Bar = { label: string; value: number; valueLabel?: string; highlight?: boolean };
export function BarChart({ data, height = 150 }: { data: Bar[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mt-5 flex items-end gap-2" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          {d.valueLabel && <span className="font-plex text-[10px] text-bq-dim">{d.valueLabel}</span>}
          <div
            className={cn("w-full rounded-[4px]", d.highlight ? "bg-bq-contrast" : "bg-bq-overlay/[0.08]")}
            style={{ height: `${Math.max((d.value / max) * height, 3)}px` }}
          />
          <span className="font-plex text-[10px] text-bq-dim">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const n = points.length - 1 || 1;
  const coords = points.map((p, i) => [
    +((i / n) * 100).toFixed(2),
    +(100 - ((p - min) / range) * 92 - 4).toFixed(2),
  ]);
  const line = coords.map((c, i) => `${i ? "L" : "M"}${c[0]},${c[1]}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="bq-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#bq-line-fill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
