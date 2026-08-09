"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSignalStream } from "@/hooks/use-signal-stream";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  ShieldCheck,
  SlidersHorizontal,
  Radio,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Card, StatCard, StatPill, HeaderActions } from "@/components/dashboard/widgets";
import { BarChart } from "@/components/dashboard/charts";
import { LoadError } from "@/components/dashboard/load-error";
import { getSignalEngineOverview } from "@/app/signal-engine-actions";
import type { Signal, Strategy } from "@/lib/signal-engine";
import {
  measuredRecord,
  monthLabel,
  signalConfidence,
  signalVenue,
  uptimeShare,
  volumeMode,
} from "@/lib/signal-engine-view";
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

/** Market time covered — on a replay, far longer than the process has run. */
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

/** How long a row stays marked as newly arrived. */
const FRESH_MS = 12_000;

/**
 * Re-renders on an interval so ages tick between refetches.
 *
 * This moves the clock, never the data. Anything that changes on screen from
 * this is time actually passing, not a number being redrawn to look busy.
 */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function age(openedAt: number | undefined, now: number): string {
  if (openedAt === undefined) return DASH;
  const seconds = Math.max(0, Math.round((now - openedAt) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_LABEL: Record<Signal["status"], { text: string; tone: "green" | "red" | "amber" | "neutral" }> = {
  active: { text: "Open", tone: "amber" },
  tp_hit: { text: "Target", tone: "green" },
  sl_hit: { text: "Stopped", tone: "red" },
  expired: { text: "Expired", tone: "neutral" },
};

/**
 * What a strategy's record actually supports, in one line.
 *
 * Reads the calibration first, so outcomes restored from a previous run and
 * ones reported over the API are counted rather than dropped. A declared rate
 * still has to say "claims" — "claims 72%" and "72%" are not the same
 * sentence, and only one of them is something the engine watched happen.
 */
function strategyRecord(strategy: Strategy): string {
  const { winRate, interval, samples, basis, external } = measuredRecord(strategy);
  const total = strategy.stats.totalSignals;
  const signals = `${total} signal${total === 1 ? "" : "s"}`;

  if (basis === "declared") {
    return `${signals} · claims ${pct(winRate, 0)}${samples ? ` on ${samples} trades` : ""} · unverified`;
  }
  if (winRate === null) return `${signals} · nothing resolved yet`;

  const ci = intervalLabel(interval);
  // Reported outcomes were not resolved under the engine's fill rules, so the
  // count says how much of the record came from outside it.
  const reported = external > 0 ? ` · ${external} reported` : "";
  return `${signals} · ${pct(winRate, 0)} win rate over ${samples}${ci ? ` · ${ci}` : ""}${reported}`;
}

/**
 * The calibrated figure and the expectancy behind a strategy.
 *
 * Expectancy sits next to the win rate because the two disagree often enough
 * to matter: a strategy winning 40% of the time at a 3:1 payoff makes money
 * and one winning 67% at 1:3 does not, and only this line says which is which.
 *
 * The calibrated number shown is the engine's presented one, matching the
 * headline card; the measured figure rides along in the tooltip so the two are
 * never more than a hover apart.
 */
function strategyCalibration(strategy: Strategy): string {
  const { avgCalibratedConfidence, expectancyPct } = strategy.stats;
  const parts: string[] = [];

  if (avgCalibratedConfidence !== null && avgCalibratedConfidence !== undefined) {
    parts.push(`${pct(avgCalibratedConfidence, 0)} calibrated`);
  }
  if (expectancyPct !== null && expectancyPct !== undefined) {
    parts.push(
      `${expectancyPct > 0 ? "+" : ""}${expectancyPct.toFixed(2)}% expectancy`,
    );
  }
  return parts.join(" · ");
}

export default function SignalEnginePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [page, setPage] = useState(0);
  const now = useNow(1_000);

  // Pushes from the engine the moment a signal opens or closes. Polling stays
  // underneath: a stream can be dropped without either end noticing.
  const stream = useSignalStream();

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
  const band = overview?.display?.confidenceBand;
  // Derived from the process uptime the engine reports, not asserted: it reads
  // low right after a restart, which is exactly when it should.
  const uptime = uptimeShare(overview?.processUptimeMs);

  // An hourly axis over a two-year replay is the wrong chart, not a quiet one:
  // it can only ever draw twenty-four bars of almost nothing. Past a couple of
  // days of feed the month becomes the unit that says something.
  const months = portfolio?.byMonth ?? [];
  const monthly =
    volumeMode(overview?.feedSpanMs ?? 0, months.length) === "monthly";
  const monthTotal = months.reduce((sum, m) => sum + (m.signals ?? 0), 0);
  const charted = (overview?.volume ?? []).reduce((sum, b) => sum + b.signals, 0);

  const bars = monthly
    ? months.map((m, i, all) => ({
        // Thin the labels the same way the hourly axis does, so a two-year
        // history does not stack twenty-four labels on top of each other.
        label: i % 3 === 0 || i === all.length - 1 ? monthLabel(m.month) : "",
        value: m.signals ?? 0,
        color: i === all.length - 1 ? "var(--primary)" : "var(--color-bq-border)",
      }))
    : (overview?.volume ?? []).map((bucket, i, all) => ({
        label: i % 3 === 0 ? bucket.hour : "",
        value: bucket.signals,
        color: i === all.length - 1 ? "var(--primary)" : "var(--color-bq-border)",
      }));

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
        {/* Says which it actually is. A green dot shown while the stream is
            down would make polling look like pushing. */}
        <span className="flex items-center gap-3 text-[12px] font-semibold">
          <span className={cn("flex items-center gap-1.5", stream.connected ? "text-bq-mint" : "text-bq-muted")}>
            <Radio className={cn("size-3.5", stream.connected && "animate-pulse")} />
            {stream.connected
              ? `Streaming · ${stream.events} event${stream.events === 1 ? "" : "s"}`
              : "Polling every 15s"}
          </span>
          <span className="flex items-center gap-1.5 text-bq-mint">
            <Sparkles className="size-3.5" />
            {overview ? `${uptimeLabel(overview.marketElapsedMs)} of market time` : "Connecting"}
          </span>
        </span>
      </div>

      {/* When the engine rescales confidence for display, the screen says so
          in its own words. A figure presented as 85 that was measured at 27 is
          the one thing on this page a reader must not mistake for a result. */}
      {band && (
        <div className="flex items-start gap-2.5 rounded-xl border border-bq-warn/30 bg-bq-warn/[0.06] px-4 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-bq-warn-text" />
          <p className="text-[12px] leading-relaxed text-bq-text">
            <span className="font-semibold text-bq-warn-text">
              Confidence is displayed rescaled into {band[0]}–{band[1]}.
            </span>{" "}
            {overview?.display?.note ??
              "The mapping is monotonic, so ordering is preserved. Position sizing, the reliability curve, ECE and Brier all use the measured value."}{" "}
            Figures on this screen are the measured ones.
          </p>
        </div>
      )}

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
        {/* The calibrated figure leads. The raw score is what the engine
            claimed; this is what that claim has historically been worth, and
            leading with the claim is the overstatement this API exists to
            stop. The raw score stays visible underneath so the gap between
            the two is legible rather than hidden. */}
        <StatCard
          label="Calibrated Confidence"
          value={pct(portfolio?.avgCalibratedConfidence)}
          // Under a display band the headline is the engine's presented figure.
          // The measured value stays on the card rather than only in the
          // banner above it, so the gap is never more than a glance away.
          sub={
            portfolio
              ? band
                ? `${pct(portfolio.avgCalibratedMeasured)} measured · ${pct(portfolio.avgConfidence)} raw`
                : `${pct(portfolio.avgConfidence)} raw score`
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
              <p className="text-[12px] text-bq-dim">
                {monthly
                  ? `Signals per month · ${months.length} months of history`
                  : overview?.volumeIsHistorical
                    ? `24 hours to ${new Date(overview.volumeAnchor).toUTCString().slice(5, 22)} UTC — the feed's own latest`
                    : "Signals opened per hour, last 24 hours (UTC)"}
              </p>
            </div>
            <StatPill tone={monthly ? "neutral" : "green"}>{monthly ? "History" : "Live"}</StatPill>
          </div>
          <div className="mt-5">
            {bars.length > 0 && <BarChart bars={bars} height={300} />}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-bq-border-soft pt-3 text-[11px] text-bq-dim">
            {monthly ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Most recent month
                </span>
                {/* Counted from byMonth, which the engine derives from the whole
                    record — not from the windowed feed, which would undercount. */}
                <span>
                  {monthTotal.toLocaleString("en-US")} resolved across{" "}
                  {monthLabel(months[0].month)}–{monthLabel(months[months.length - 1].month)}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Current hour, still filling
                </span>
                {/* The window is capped at what one request returns, so a busy
                    engine would otherwise quietly chart a partial day as a full one. */}
                <span>
                  {charted} in 24h{overview?.volumeIsHistorical ? " of feed time" : ""}
                  {overview?.windowed
                    ? ` · from the most recent ${overview.signals.length} of ${overview.totalSignals}`
                    : ""}
                </span>
              </>
            )}
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
                  {/* Calibrated confidence and expectancy per strategy: a win
                      rate on its own hides that 72% at a 1:3 payoff still
                      loses money. */}
                  <p
                    className="text-[11px] text-bq-muted"
                    title={
                      s.stats.avgCalibratedMeasured !== null &&
                      s.stats.avgCalibratedMeasured !== undefined
                        ? `${pct(s.stats.avgCalibratedMeasured)} measured`
                        : undefined
                    }
                  >
                    {strategyCalibration(s)}
                  </p>
                </div>
                {/* No toggle: the engine exposes no endpoint that would turn a
                    strategy off, and a switch that silently does nothing is
                    worse than no switch. */}
                <StatPill tone={s.active ? "green" : "neutral"}>{s.active ? "Live" : "Tracked"}</StatPill>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-bq-border-soft pt-3 text-[12px]">
            <span className="text-bq-muted" title="Share of the last 24 hours the engine process has been serving">
              Engine uptime
            </span>
            <span
              className={cn(
                "font-bold",
                uptime !== null && uptime < 90 ? "text-bq-warn-text" : "text-bq-heading",
              )}
            >
              {uptime === null ? DASH : `${uptime.toFixed(1)}%`}
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
          <table className="w-full min-w-[1120px] text-left text-[13px]">
            <thead>
              <tr className="border-y border-bq-border-soft font-plex text-[10px] uppercase tracking-[1px] text-bq-dim">
                <th className="px-5 py-2.5 font-medium">Age</th>
                <th className="px-5 py-2.5 font-medium">Pair</th>
                <th className="px-5 py-2.5 font-medium">Signal</th>
                <th className="px-5 py-2.5 font-medium">Confidence</th>
                <th className="px-5 py-2.5 font-medium">Measured</th>
                <th className="px-5 py-2.5 font-medium">Raw Score</th>
                <th className="px-5 py-2.5 font-medium">Entry</th>
                <th className="px-5 py-2.5 font-medium">Take Profit</th>
                <th className="px-5 py-2.5 font-medium">Stop Loss</th>
                <th className="px-5 py-2.5 font-medium">Strategy</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Venue</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-[12px] text-bq-dim">
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
                const score = signalConfidence(r);
                // Freshness is read off the clock, so the highlight fades on
                // its own as time passes rather than being scheduled.
                const fresh = r.openedAt !== undefined && now - r.openedAt < FRESH_MS;
                const venue = signalVenue(r);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-bq-border-soft transition-colors duration-700 last:border-0",
                      fresh && "bg-bq-mint/[0.07]",
                    )}
                  >
                    <td className="px-5 py-3.5 font-plex" title={signalTime(r)}>
                      <span className="flex items-center gap-2">
                        {fresh && (
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-bq-mint opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-bq-mint" />
                          </span>
                        )}
                        <span className={cn("tabular-nums", fresh ? "text-bq-mint" : "text-bq-muted")}>
                          {age(r.openedAt, now)}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-bq-heading">{r.pair}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("font-bold", r.dir === "BUY" ? "text-primary" : "text-bq-loss-text")}>
                        {r.dir}
                      </span>
                    </td>
                    {/* Calibrated leads; a dash means nothing has backed this
                        score yet, which is the same "not measured" the win
                        rates use rather than a quiet fallback to the claim. */}
                    <td
                      className="px-5 py-3.5"
                      title={
                        [
                          intervalLabel(score.interval),
                          score.samples ? `${score.samples} samples` : null,
                          score.basis === "raw" ? "no history behind this score yet" : null,
                          score.basis === "declared" ? "standing on a declared rate" : null,
                          score.banded ? `shown as ${pct(score.display, 0)} under the display band` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || undefined
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-bq-border">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(0, score.display ?? score.measured ?? 0))}%` }}
                          />
                        </span>
                        <span className="tabular-nums text-bq-text">
                          {pct(score.display ?? score.measured, 0)}
                        </span>
                      </span>
                    </td>
                    {/* The measured figure sits beside the presented one rather
                        than behind a hover: on a banded feed they differ by
                        forty points and only one of them is a measurement. */}
                    <td className="px-5 py-3.5 tabular-nums text-bq-text">
                      {pct(score.measured, 0)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-bq-muted">
                      {pct(score.raw, 0)}
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
                    <td className="px-5 py-3.5">
                      {venue.url ? (
                        <a
                          href={venue.url}
                          target="_blank"
                          // noreferrer as well as noopener: the destination is
                          // a third-party page named by an external feed.
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-bq-heading underline decoration-bq-border underline-offset-2 transition-colors hover:decoration-bq-heading"
                          title={venue.chain ? `${venue.name} on ${venue.chain}` : venue.name ?? undefined}
                        >
                          {venue.name ?? "View"}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        // An exchange fill has a trade id but no page. Naming
                        // the venue beats a link that would 404.
                        <span className="text-bq-dim">{venue.name ?? DASH}</span>
                      )}
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
