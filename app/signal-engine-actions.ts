"use server";

import { revalidatePath } from "next/cache";
import { currentUserId } from "@/lib/session";
import {
  getSnapshot,
  hourlyVolume,
  isSignalEngineConfigured,
  listSignals,
  registerStrategy,
  reportOutcomes,
  SignalEngineError,
  type RegisterStrategyInput,
  type RegisterStrategyResult,
  type ReportOutcomesInput,
  type ReportOutcomesResult,
  type Signal,
  type Stats,
  type Strategy,
  type VolumeBucket,
} from "@/lib/signal-engine";

/**
 * The Signal Engine screen's data, and the two writes behind it.
 *
 * The engine is a separate process that can be absent, misconfigured or simply
 * down, and those are three different sentences to show a user — so they stay
 * distinct all the way to the component instead of collapsing into one null.
 */

/** The engine's ceiling. Asking for more is rejected, not truncated. */
const SIGNAL_WINDOW = 1000;

/** Hours the volume chart covers. */
const VOLUME_HOURS = 24;

export type SignalEngineOverview = {
  generatedAt: string;
  /** Where the trade feed came from, when the engine names it. */
  source: string | null;
  pairs: string[];
  timeframes: string[];
  uptimeMs: number | null;
  portfolio: Stats;
  /** Live strategies first, then whatever has been measured most. */
  strategies: Strategy[];
  /** Newest first, straight from the engine. */
  signals: Signal[];
  volume: VolumeBucket[];
  /** Signals matching the query before the window was applied. */
  totalSignals: number;
  /**
   * True when the engine held more signals than one request returns, so the
   * volume chart is drawn from a window rather than from everything.
   */
  windowed: boolean;
};

export type SignalEngineView =
  | { status: "ok"; overview: SignalEngineOverview }
  | { status: "unauthenticated" }
  | { status: "unconfigured" }
  | { status: "unavailable" };

/**
 * Everything the screen renders, in one round trip per source.
 *
 * The snapshot and the signal list are fetched together rather than in
 * sequence: they are independent, and the screen is unusable without both.
 */
export async function getSignalEngineOverview(): Promise<SignalEngineView> {
  if ((await currentUserId()) === null) return { status: "unauthenticated" };
  if (!isSignalEngineConfigured()) return { status: "unconfigured" };

  try {
    const [snapshot, feed] = await Promise.all([
      getSnapshot(),
      listSignals({ limit: SIGNAL_WINDOW }),
    ]);

    return {
      status: "ok",
      overview: {
        generatedAt: snapshot.generatedAt,
        source: snapshot.source ?? null,
        pairs: snapshot.pairs ?? [],
        timeframes: snapshot.timeframes ?? [],
        uptimeMs: snapshot.uptimeMs ?? null,
        portfolio: snapshot.portfolio,
        strategies: rankStrategies(snapshot.strategies),
        signals: feed.signals,
        volume: hourlyVolume(feed.signals, Date.now(), VOLUME_HOURS),
        totalSignals: feed.total,
        windowed: feed.total > feed.returned,
      },
    };
  } catch (error) {
    // The message carries the engine's address and its own error text, which
    // belong in the server log rather than in a browser.
    reportFailure("load the signal engine snapshot", error);
    return { status: "unavailable" };
  }
}

/**
 * Live strategies first, then by how much has actually been measured.
 *
 * Sorting on resolved outcomes rather than on win rate is deliberate: a
 * strategy sitting at 100% off two trades would otherwise lead the list, and
 * the ordering would be an endorsement the record cannot support.
 */
function rankStrategies(strategies: Strategy[]): Strategy[] {
  return [...strategies].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      b.stats.resolved - a.stats.resolved ||
      b.stats.totalSignals - a.stats.totalSignals ||
      a.name.localeCompare(b.name),
  );
}

export type WriteResult<T> =
  | { status: "ok"; data: T }
  | { status: "error"; message: string };

/**
 * Registers an outside strategy with the engine so it can be tracked.
 *
 * The engine treats a repeat id as an update and says so with `created:
 * false`; that is a success and is returned as one.
 */
export async function registerTrackedStrategy(
  input: RegisterStrategyInput,
): Promise<WriteResult<RegisterStrategyResult>> {
  if ((await currentUserId()) === null) {
    return { status: "error", message: "Sign in to register a strategy." };
  }
  if (!isSignalEngineConfigured()) {
    return { status: "error", message: "The signal engine is not connected." };
  }

  try {
    const data = await registerStrategy(input);
    revalidatePath("/dashboard/signal-engine");
    return { status: "ok", data };
  } catch (error) {
    reportFailure(`register strategy ${input.id}`, error);
    return { status: "error", message: writeFailureMessage(error) };
  }
}

/** Adds resolved outcomes to a strategy's calibration at a given score. */
export async function reportStrategyOutcomes(
  id: string,
  input: ReportOutcomesInput,
): Promise<WriteResult<ReportOutcomesResult>> {
  if ((await currentUserId()) === null) {
    return { status: "error", message: "Sign in to report outcomes." };
  }
  if (!isSignalEngineConfigured()) {
    return { status: "error", message: "The signal engine is not connected." };
  }

  try {
    const data = await reportOutcomes(id, input);
    revalidatePath("/dashboard/signal-engine");
    return { status: "ok", data };
  } catch (error) {
    reportFailure(`report outcomes for ${id}`, error);
    return { status: "error", message: writeFailureMessage(error) };
  }
}

/**
 * What a failed write can safely say.
 *
 * A 4xx is the caller's own body coming back and is worth repeating verbatim —
 * "a rate outside 0-100" is actionable. Anything else is the engine's
 * internals, which the log already has.
 */
function writeFailureMessage(error: unknown): string {
  if (error instanceof SignalEngineError && error.status) {
    if (error.status === 409) {
      return "That id belongs to a built-in strategy. Choose another.";
    }
    if (error.status === 401 || error.status === 403) {
      return "The signal engine rejected the credentials for this write.";
    }
    if (error.status < 500 && error.detail) return error.detail;
  }
  if (error instanceof Error && !(error instanceof SignalEngineError)) {
    // A zod failure on the way out — the input never left this process.
    return error.message;
  }
  return "The signal engine could not be reached. Try again shortly.";
}

function reportFailure(action: string, error: unknown) {
  const detail =
    error instanceof SignalEngineError
      ? `${error.message}${error.detail ? ` — ${error.detail}` : ""}`
      : error;
  console.error(`[signal-engine] failed to ${action}:`, detail);
}
