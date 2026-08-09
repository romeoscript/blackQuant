"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatCard, StatPill, HeaderActions } from "@/components/dashboard/widgets";
import { BarChart } from "@/components/dashboard/charts";
import { LoadError } from "@/components/dashboard/load-error";
import { getSignalEngineOverview } from "@/app/signal-engine-actions";
import type { Signal, Strategy } from "@/lib/signal-engine";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "BUY", "SELL"] as const;

/** How often the screen re-reads the engine. Signals open on closed bars. */
const REFRESH_MS = 15_000;

/**
 * Rows per page in the feed.
 *
 * Paging happens over the window already fetched rather than per request:
 * `/api/signals` takes `status`, `strategy`, `pair` and `limit` and no offset
 * or cursor, so there is no page 2 to ask the engine for. The window is the
 * same one the volume chart is drawn from.
 */
const PAGE_SIZE = 25;

const DASH = "—";

/** A percentage the engine may not have measured yet. Never shown as 0%. */
const pct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? DASH : `${value.toFixed(digits)}%`;

/** `[low, high]` as prose, so the width of the claim is visible. */
const intervalLabel = (bounds: [number, number] | null | undefined) =>
  bounds ? `90% CI ${bounds[0].toFixed(0)}-${bounds[1].toFixed(0)}%` : null;

/**
 * Prices span BTC and sub-cent alts in the same table, so decimals follow the
 * magnitude rather than a fixed 2 that would round a $0.0004 pair to nothing.
 */
function price(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function uptimeLabel(ms: number | null): string {
  if (ms === null) return DASH;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

const signalTime = (signal: Signal) =>
  signal.time ??
  (signal.openedAt === undefined
    ? DASH
    : new Date(signal.openedAt).toLocaleTimeString("en-GB", { hour12: false }));

const STATUS_LABEL: Record<Signal["status"], { text: string; tone: "green" | "red" | "amber" | "neutral" }> = {
  active: { text: "Open", tone: "amber" },
  tp_hit: { text: "Target", tone: "green" },
  sl_hit: { text: "Stopped", tone: "red" },
  expired: { text: "Expired", tone: "neutral" },
};

/**
 * What a strategy's record actually supports, in one line.
 *
 * A registered strategy has no measurements of its own until outcomes are
 * reported for it, and the engine is explicit that a declared rate is a claim
 * standing in for one. That distinction is kept here — "claims 72%" and
 * "72%" are not the same sentence.
 */
function strategyRecord(strategy: Strategy): string {
  const { totalSignals, resolved, winRate, winRateInterval } = strategy.stats;
  const signals = `${totalSignals} signal${totalSignals === 1 ? "" : "s"}`;

  if (winRate !== null && winRate !== undefined) {
    const ci = intervalLabel(winRateInterval);
    return `${signals} · ${pct(winRate, 0)} win rate over ${resolved}${ci ? ` · ${ci}` : ""}`;
  }
  const declared = strategy.declared?.winRate;
  if (declared !== null && declared !== undefined) {
    const samples = strategy.declared?.samples;
    return `${signals} · claims ${pct(declared, 0)}${samples ? ` on ${samples} trades` : ""} · unverified`;
  }
  return `${signals} · nothing resolved yet`;
}

export default function SignalEnginePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [page, setPage] = useState(0);

  const { data: view, isError, refetch } = useQuery({
    queryKey: ["signal-engine"],
    queryFn: () => getSignalEngineOverview(),
    // Only the newest page auto-refreshes. Further in, a refetch would
    // renumber the rows under someone who is reading them, which is a worse
    // failure than a page that is a few seconds stale.
    refetchInterval: page === 0 ? REFRESH_MS : false,
  });

  // The engine is a process of its own: absent, unreachable and unauthorised
  // are three different problems and each gets its own sentence.
  if (isError || (view && view.status !== "ok")) {
    const message =
      view?.status === "unconfigured"
        ? "The signal engine isn't connected. Set SIGNAL_ENGINE_BASE_URL to the engine's address."
        : view?.status === "unauthenticated"
          ? "Your session has expired. Sign in again to see the feed."
          : "We couldn't reach the signal engine. No signals are lost — this is only the view.";
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Signal Engine" actions={<HeaderActions />} />
        <LoadError message={message} onRetry={() => refetch()} />
      </div>
    );
  }

  const overview = view?.status === "ok" ? view.overview : undefined;
  const strategies = overview?.strategies ?? [];
  const live = strategies.filter((s) => s.active);
  const tracked = strategies.length - live.length;
  const portfolio = overview?.portfolio;

  const bars = (overview?.volume ?? []).map((bucket, i, all) => ({
    label: i % 3 === 0 ? bucket.hour : "",
    value: bucket.signals,
    color: i === all.length - 1 ? "var(--primary)" : "var(--color-bq-border)",
  }));
  const charted = (overview?.volume ?? []).reduce((sum, b) => sum + b.signals, 0);

  const matched = (overview?.signals ?? []).filter((s) =>
    filter === "All" ? true : s.dir === filter,
  );
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  // Clamped on the way out rather than corrected in an effect: a refetch that
  // shortens the feed would otherwise leave the table empty on a page that no
  // longer exists, for one render.
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const rows = matched.slice(start, start + PAGE_SIZE);

  const goTo = (next: number) => setPage(Math.min(Math.max(next, 0), pageCount - 1));
  const pick = (next: (typeof FILTERS)[number]) => {
    setFilter(next);
    // The row at position 26 of BUY is not the row at position 26 of All.
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Signal Engine" actions={<HeaderActions />} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bq-mint/25 bg-bq-mint/[0.06] px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13px] text-bq-text">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-bq-mint opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-bq-mint" />
          </span>
          {overview
            ? `Scanning ${overview.pairs.length} market${overview.pairs.length === 1 ? "" : "s"} across ${live.length} live ${live.length === 1 ? "strategy" : "strategies"}${overview.source ? ` from ${overview.source}` : ""}.`
            : "Connecting to the signal engine…"}
        </p>
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-bq-mint">
          <Sparkles className="size-3.5" />
          {overview ? `Up ${uptimeLabel(overview.uptimeMs)}` : "Connecting"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Signals Tracked"
          value={portfolio ? String(portfolio.totalSignals) : DASH}
          sub={
            portfolio
              ? `${portfolio.activeSignals ?? 0} still open · ${portfolio.resolved} resolved`
              : undefined
          }
          icon={Zap}
        />
        <StatCard
          label="Markets Scanned"
          value={overview ? String(overview.pairs.length) : DASH}
          sub={overview?.timeframes.length ? overview.timeframes.join(" · ") : undefined}
          icon={Globe}
        />
        <StatCard
          label="Avg Confidence"
          value={pct(portfolio?.avgConfidence)}
          // The raw score is what the engine claimed; the calibrated one is
          // what that claim has historically been worth. Showing the first
          // without the second is the overstatement this API exists to stop.
          sub={
            portfolio
              ? `${pct(portfolio.avgCalibratedConfidence)} calibrated`
              : undefined
          }
          icon={ShieldCheck}
          green
        />
        <StatCard
          label="Live Strategies"
          value={overview ? `${live.length} / ${strategies.length}` : DASH}
          sub={overview ? `${tracked} tracked, not run` : undefined}
          icon={SlidersHorizontal}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-bq-heading">Signal Volume</h2>
              <p className="text-[12px] text-bq-dim">Signals opened per hour, last 24 hours (UTC)</p>
            </div>
            <StatPill tone="green">Live</StatPill>
          </div>
          <div className="mt-5">
            {bars.length > 0 && <BarChart bars={bars} height={160} />}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Current hour, still filling
            </span>
            {/* The window is capped at what one request returns, so a busy
                engine would otherwise quietly chart a partial day as a full one. */}
            <span>
              {charted} in 24h
              {overview?.windowed
                ? ` · from the most recent ${overview.signals.length} of ${overview.totalSignals}`
                : ""}
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-bq-heading">Strategy Engine</h2>
          <p className="text-[12px] text-bq-dim">
            Live strategies run on every closed bar. Tracked ones are recorded, never run.
          </p>
          <div className="mt-4 space-y-2">
            {strategies.length === 0 && (
              <p className="rounded-lg border border-dashed border-bq-border px-3 py-6 text-center text-[12px] text-bq-dim">
                {overview ? "The engine is running no strategies." : "Loading strategies…"}
              </p>
            )}
            {strategies.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-bq-border bg-bq-bg px-3 py-2.5"
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", s.active ? "bg-primary" : "bg-bq-dim")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-bq-heading">
                    {s.name}
                    {s.timeframe && <span className="ml-1.5 text-[11px] font-normal text-bq-dim">{s.timeframe}</span>}
                  </p>
                  <p className="text-[11px] text-bq-dim">{strategyRecord(s)}</p>
                </div>
                {/* No toggle: the engine exposes no endpoint that would turn a
                    strategy off, and a switch that silently does nothing is
                    worse than no switch. */}
                <StatPill tone={s.active ? "green" : "neutral"}>{s.active ? "Live" : "Tracked"}</StatPill>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[12px]">
            <span className="text-bq-muted">Portfolio expectancy</span>
            <span className="font-bold text-bq-heading">
              {portfolio?.expectancyPct === null || portfolio?.expectancyPct === undefined
                ? DASH
                : `${portfolio.expectancyPct > 0 ? "+" : ""}${portfolio.expectancyPct.toFixed(2)}%`}
            </span>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-semibold text-bq-heading">Live Signal Feed</h2>
            <p className="text-[12px] text-bq-dim">Most recent signals fired by the engine</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-bq-border bg-bq-bg p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => pick(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filter === f ? "bg-bq-surface text-bq-heading" : "text-bq-muted hover:text-bq-text",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-[13px]">
            <thead>
              <tr className="border-y border-bq-border-soft font-plex text-[10px] uppercase tracking-[1px] text-bq-dim">
                <th className="px-5 py-2.5 font-medium">Time</th>
                <th className="px-5 py-2.5 font-medium">Pair</th>
                <th className="px-5 py-2.5 font-medium">Signal</th>
                <th className="px-5 py-2.5 font-medium">Confidence</th>
                <th className="px-5 py-2.5 font-medium">Calibrated</th>
                <th className="px-5 py-2.5 font-medium">Entry</th>
                <th className="px-5 py-2.5 font-medium">Take Profit</th>
                <th className="px-5 py-2.5 font-medium">Stop Loss</th>
                <th className="px-5 py-2.5 font-medium">Strategy</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-[12px] text-bq-dim">
                    {overview
                      ? filter === "All"
                        ? "The engine hasn't opened a signal yet."
                        : `No ${filter} signals in the current window.`
                      : "Loading the feed…"}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const status = STATUS_LABEL[r.status];
                return (
                  <tr key={r.id} className="border-b border-bq-border-soft last:border-0">
                    <td className="px-5 py-3.5 font-plex text-bq-muted">{signalTime(r)}</td>
                    <td className="px-5 py-3.5 font-medium text-bq-heading">{r.pair}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("font-bold", r.dir === "BUY" ? "text-primary" : "text-bq-loss-text")}>
                        {r.dir}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-bq-border">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(0, r.confidence))}%` }}
                          />
                        </span>
                        <span className="tabular-nums text-bq-text">{pct(r.confidence, 0)}</span>
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 tabular-nums text-bq-muted"
                      title={intervalLabel(r.calibration?.interval) ?? undefined}
                    >
                      {pct(r.calibratedConfidence, 0)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-bq-heading">{price(r.entry)}</td>
                    <td className="px-5 py-3.5 tabular-nums text-primary">{price(r.tp)}</td>
                    <td className="px-5 py-3.5 tabular-nums text-bq-loss-text">{price(r.sl)}</td>
                    <td className="px-5 py-3.5">
                      <StatPill tone="neutral">{r.strategyName ?? r.strategy}</StatPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatPill tone={status.tone}>{status.text}</StatPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {matched.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bq-border-soft px-5 py-3">
            <p className="text-[11px] text-bq-dim">
              Showing{" "}
              <span className="tabular-nums text-bq-text">
                {start + 1}–{start + rows.length}
              </span>{" "}
              of <span className="tabular-nums text-bq-text">{matched.length}</span>
              {filter === "All" ? "" : ` ${filter}`} signal{matched.length === 1 ? "" : "s"}
              {/* The window is what one request returns, not the whole record. */}
              {overview?.windowed && filter === "All"
                ? ` · newest ${overview.signals.length} of ${overview.totalSignals}`
                : ""}
              {page > 0 ? " · live updates paused" : ""}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
                aria-label="Previous page"
                className="flex items-center gap-1 rounded-md border border-bq-border px-2.5 py-1.5 text-[12px] font-medium text-bq-heading transition-colors hover:bg-bq-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="size-3.5" /> Prev
              </button>
              <span className="px-2 text-[11px] tabular-nums text-bq-muted">
                {current + 1} / {pageCount}
              </span>
              <button
                onClick={() => goTo(current + 1)}
                disabled={current >= pageCount - 1}
                aria-label="Next page"
                className="flex items-center gap-1 rounded-md border border-bq-border px-2.5 py-1.5 text-[12px] font-medium text-bq-heading transition-colors hover:bg-bq-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
