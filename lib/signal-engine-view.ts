import type { Signal, Strategy } from "@/lib/signal-engine";

/**
 * Pure derivations over the signal engine's payloads.
 *
 * Deliberately separate from `lib/signal-engine.ts`: that module reads `env`
 * to reach the engine, so importing a value from it into a client component
 * would pull environment parsing into the browser bundle. Nothing here does
 * any I/O, and the imports above are type-only and erased at build, so this
 * file is safe on both sides of the boundary.
 *
 * The theme throughout is that the calibrated figure leads. The raw score is
 * what the engine claimed; the calibrated one is what that claim has
 * historically been worth, and it is the one a reader should act on.
 */

export type MeasuredRecord = {
  winRate: number | null;
  interval: [number, number] | null;
  /** Resolved outcomes behind a measurement, or claimed trades behind a claim. */
  samples: number;
  /**
   * `calibration` — everything the calibration stands on, restored outcomes
   * included. `stats` — this run only. `declared` — a claim, never a result.
   */
  basis: "calibration" | "stats" | "declared" | "none";
  /** Of the calibration's outcomes, how many were reported over the API. */
  external: number;
};

/**
 * What a strategy's win rate currently rests on, calibration first.
 *
 * `calibrationBasis` is the fuller record: it carries outcomes restored from a
 * previous run and ones reported over the API, so after a restart it differs
 * from this run's `stats` by the entire store. Reading `stats` first would
 * quietly discard that history and show a strategy as unmeasured minutes after
 * it was measured.
 *
 * A declared rate is never promoted into a measurement. It comes back under
 * its own basis so the caller has to say "claims" rather than print it as
 * something the engine observed.
 */
export function measuredRecord(strategy: Strategy): MeasuredRecord {
  const basis = strategy.calibrationBasis;
  const external = basis?.origins?.external?.n ?? 0;

  if (basis?.winRate !== null && basis?.winRate !== undefined) {
    return {
      winRate: basis.winRate,
      interval: basis.interval ?? null,
      samples: basis.resolved ?? 0,
      basis: "calibration",
      external,
    };
  }

  const { winRate, winRateInterval, resolved } = strategy.stats;
  if (winRate !== null && winRate !== undefined) {
    return {
      winRate,
      interval: winRateInterval ?? null,
      samples: resolved,
      basis: "stats",
      external,
    };
  }

  const declared = strategy.declared ?? basis?.declared;
  if (declared?.winRate !== null && declared?.winRate !== undefined) {
    return {
      winRate: declared.winRate,
      interval: null,
      samples: declared.samples ?? 0,
      basis: "declared",
      external,
    };
  }

  return { winRate: null, interval: null, samples: resolved, basis: "none", external };
}

export type SignalConfidence = {
  /**
   * The measured figure — what position sizing and every calibration metric
   * actually use. This is the number to trust and to lead with.
   */
  measured: number | null;
  /** The figure as the engine presents it, rescaled if a band is active. */
  display: number | null;
  /** True when `display` has been rescaled away from `measured`. */
  banded: boolean;
  /** The raw weighted-component score. Never rewritten. */
  raw: number;
  interval: [number, number] | null;
  samples: number;
  /**
   * `strategy` measured, `declared` a claim standing in for a measurement,
   * `raw` no history at all — the score handed straight back.
   */
  basis: "strategy" | "declared" | "raw";
};

/**
 * A signal's confidence, measured figure first.
 *
 * `calibratedConfidence` is a *display* number: when the snapshot declares a
 * `display.confidenceBand` the engine rescales it into that band, so a signal
 * measured at 26.7 can present as 85.3. `calibratedMeasured` carries the
 * measurement either way, which is why it — not the rescaled figure — is what
 * this returns as the truth.
 *
 * Engines that declare no band omit `calibratedMeasured`, in which case the
 * display figure *is* the measured one and `banded` is false.
 */
export function signalConfidence(signal: Signal): SignalConfidence {
  const calibration = signal.calibration;
  const display = signal.calibratedConfidence ?? calibration?.confidence ?? null;
  const measured = signal.calibratedMeasured ?? display;

  return {
    measured,
    display,
    banded:
      measured !== null && display !== null && Math.abs(measured - display) > 0.05,
    raw: signal.confidence,
    interval: calibration?.interval ?? null,
    samples: calibration?.samples ?? 0,
    basis: calibration?.basis ?? "raw",
  };
}

/**
 * Share of the trailing window the engine has actually been serving.
 *
 * The API publishes no availability figure — only how long the current process
 * has been up — so this is derived rather than reported: an engine that
 * started six hours ago has served a quarter of the last day, and says so. It
 * climbs into the nineties once the process has run most of a day and drops to
 * near zero right after a restart, which is the point of showing it.
 *
 * Deliberately not a fabricated "99.8%". A reliability number that cannot go
 * down is not a reliability number.
 */
export function uptimeShare(
  processUptimeMs: number | null | undefined,
  windowMs = 24 * 3_600_000,
): number | null {
  if (processUptimeMs === null || processUptimeMs === undefined) return null;
  if (processUptimeMs < 0 || windowMs <= 0) return null;
  return (Math.min(processUptimeMs, windowMs) / windowMs) * 100;
}

export type SignalVenue = {
  /** Where the signal can be looked up, or null when the feed has no page. */
  url: string | null;
  /** The venue that filled it — a DEX name, or the exchange. */
  name: string | null;
  /** Chain, for on-chain pairs only. */
  chain: string | null;
};

/**
 * Only ever `http(s)`, and only ever a URL that parses.
 *
 * These strings arrive from an external feed and are rendered as links, so a
 * `javascript:` payload would otherwise be one click from executing in the
 * page. Anything that is not a plain web URL is dropped rather than sanitised
 * into something that merely looks safe.
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
}

/**
 * Where a signal came from, preferring the pair page over the raw fill.
 *
 * On chain the market carries a DexScreener page for the pair, which is what
 * someone actually wants to open. An exchange fill has a trade id and a venue
 * but no page, so it names the venue and offers no link rather than inventing
 * one that would 404.
 */
export function signalVenue(signal: Signal): SignalVenue {
  const market = signal.market;
  const trigger = signal.trigger;
  return {
    url: safeUrl(market?.url) ?? safeUrl(trigger?.url),
    name: market?.dex ?? trigger?.venue ?? market?.source ?? null,
    chain: market?.chain ?? null,
  };
}

export type VolumeMode = "hourly" | "monthly";

/** Below this the feed is a live session; above it, a history. */
const MULTI_DAY_MS = 2 * 24 * 3_600_000;

/**
 * Which axis actually says something about this feed.
 *
 * An hourly chart over a two-year replay is not a quiet chart, it is the wrong
 * chart: 5957 signals spread across 730 days put roughly eight in any given
 * day, so twenty-four bars of nearly nothing is all it can ever draw. Once the
 * feed spans more than a couple of days the month is the honest unit.
 */
export function volumeMode(feedSpanMs: number, months: number): VolumeMode {
  return feedSpanMs > MULTI_DAY_MS && months >= 2 ? "monthly" : "hourly";
}

/** `2026-08` as `Aug 26`, which is what fits under a bar. */
export function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  const name = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][Number(index) - 1];
  return name ? `${name} ${year.slice(2)}` : month;
}

export type VolumeBucket = {
  /** Epoch ms at the top of the hour this bucket covers. */
  startedAt: number;
  /** Hour of day, zero-padded, in the viewer-independent UTC the engine uses. */
  hour: string;
  signals: number;
};

const HOUR_MS = 3_600_000;

/**
 * Signals per hour over the trailing window, oldest bucket first.
 *
 * `now` is an anchor rather than necessarily the wall clock: a replayed feed's
 * signals can be days old, and a window pinned to the real clock would render
 * an entirely empty chart for a feed full of data. Callers pass the feed's own
 * latest timestamp when it has fallen behind.
 *
 * Buckets are emitted even when empty, so a quiet stretch reads as quiet
 * rather than compressing the axis and implying steady activity. The final
 * bucket is the hour in progress and is always partial — the caller is
 * expected to mark it rather than let it read as a completed hour that fell
 * off a cliff.
 */
export function hourlyVolume(
  signals: Signal[],
  now = Date.now(),
  hours = 24,
): VolumeBucket[] {
  const currentHour = Math.floor(now / HOUR_MS) * HOUR_MS;
  const buckets = new Map<number, number>();
  for (let i = hours - 1; i >= 0; i--) buckets.set(currentHour - i * HOUR_MS, 0);

  for (const signal of signals) {
    // A signal with no open time cannot be placed on the axis; counting it in
    // the current hour would invent activity that never happened.
    if (signal.openedAt === undefined) continue;
    const bucket = Math.floor(signal.openedAt / HOUR_MS) * HOUR_MS;
    const count = buckets.get(bucket);
    if (count !== undefined) buckets.set(bucket, count + 1);
  }

  return [...buckets].map(([startedAt, count]) => ({
    startedAt,
    hour: String(new Date(startedAt).getUTCHours()).padStart(2, "0"),
    signals: count,
  }));
}
