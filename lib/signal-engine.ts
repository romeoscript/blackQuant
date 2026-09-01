import { z } from "zod";
import { env } from "@/lib/env";

/**
 * The dexwatch signal engine — the process that watches the trade feed, fires
 * signals and measures what they were worth. One `fetch` per call and no SDK,
 * matching how `lib/nowpayments.ts` talks to NOWPayments.
 *
 * Two properties of this API shape everything below.
 *
 * Every rate can be null. The engine publishes a win rate only once something
 * has actually resolved, so `null` survives into these types instead of being
 * defaulted to zero — "not measured yet" and "measured at 0%" are different
 * claims and only one of them is an indictment of the strategy.
 *
 * Every rate it does publish carries a 90% credible interval, because 3/4 and
 * 300/400 are both "75%" and only one is worth acting on. The interval is
 * carried through to the screen rather than dropped for a tidier number.
 *
 * This API places no orders. Nothing reachable from here can move money.
 */

export const isSignalEngineConfigured = () =>
  Boolean(env.SIGNAL_ENGINE_BASE_URL);

/** Long enough for a busy engine, short enough that a dead one is not a hang. */
const TIMEOUT_MS = 5_000;

export class SignalEngineError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "SignalEngineError";
  }
}

/* -------------------------------------------------------------------------- */
/* The wire contract                                                           */
/* -------------------------------------------------------------------------- */

/** A percentage the engine reports as null until something has resolved. */
const rate = z.number().nullable().optional();

/** A 90% credible interval as `[low, high]` percentages. */
const interval = z.tuple([z.number(), z.number()]).nullable().optional();

const errorSchema = z.object({
  error: z.string(),
  detail: z.string().optional(),
});

const reliabilityBinSchema = z.object({
  bin: z.string(),
  signals: z.number(),
  /** Mean raw score claimed in this bin. */
  predicted: z.number(),
  realized: z.number(),
  realizedInterval: interval,
  gapPp: z.number(),
  /** True only when the claim falls outside what the record supports. */
  significant: z.boolean(),
});

const calibrationSchema = z.object({
  curve: z.array(reliabilityBinSchema).optional(),
  samples: z.number().optional(),
  /** Expected calibration error in points — how overconfident the score is. */
  ece: z.number().nullable().optional(),
  brierRaw: z.number().nullable().optional(),
  /** Below `brierRaw` means calibrating helped. Out-of-sample, so not circular. */
  brierCalibrated: z.number().nullable().optional(),
  discrimination: z
    .object({
      splitAt: z.number().optional(),
      lowWinRate: rate,
      highWinRate: rate,
      gapPp: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const originCountSchema = z.object({
  n: z.number().optional(),
  wins: z.number().optional(),
});

const calibrationBasisSchema = z
  .object({
    resolved: z.number().optional(),
    wins: z.number().optional(),
    winRate: rate,
    interval,
    /** Resolved by the engine against reported over the API. Never merged. */
    origins: z
      .object({
        engine: originCountSchema.optional(),
        external: originCountSchema.optional(),
      })
      .optional(),
    declared: z
      .object({ winRate: rate, samples: z.number().optional() })
      .nullable()
      .optional(),
    bins: z
      .array(
        z.object({
          bin: z.string(),
          signals: z.number().optional(),
          wins: z.number().optional(),
          winRate: rate,
          interval,
        }),
      )
      .optional(),
  })
  .nullable()
  .optional();

/**
 * The print a signal entered on. Replayed history has none and reports null.
 */
const tradeRefSchema = z
  .object({
    /** `tx` on-chain, `trade-id` an exchange fill, `simulated` the demo feed. */
    type: z.enum(["tx", "trade-id", "simulated"]).optional(),
    id: z.string().optional(),
    url: z.string().nullable().optional(),
    venue: z.string().nullable().optional(),
    trader: z.string().nullable().optional(),
    at: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

/**
 * Venue state when the signal fired, where the feed reports it.
 *
 * Liquidity and taker flow are scored as confidence components, so they move
 * the score and are then calibrated against outcomes like every other input.
 * Sources that report none of it leave this null.
 */
const marketStateSchema = z
  .object({
    source: z.string().optional(),
    chain: z.string().optional(),
    dex: z.string().optional(),
    pairAddress: z.string().optional(),
    url: z.string().nullable().optional(),
    priceUsd: z.number().optional(),
    liquidityUsd: z.number().optional(),
    volume24hUsd: z.number().optional(),
    fdvUsd: z.number().optional(),
    /** Taker buys in the last hour. */
    buys: z.number().optional(),
    sells: z.number().optional(),
    /** Null when nothing traded in the window, never a fabricated 0.5. */
    buyRatio: z.number().nullable().optional(),
    priceChange24h: z.number().optional(),
    ageDays: z.number().nullable().optional(),
    at: z.number().optional(),
  })
  .nullable()
  .optional();

/**
 * Profit as a sum of percentage moves, one unit staked per signal. No
 * compounding, no fees, no slippage — position sizing is the caller's call.
 */
const profitSchema = z
  .object({
    totalPnlPct: z.number().optional(),
    grossWinPct: z.number().optional(),
    grossLossPct: z.number().optional(),
    /** Gross win over gross loss. Below 1 loses money whatever the win rate. */
    profitFactor: z.number().nullable().optional(),
    bestPct: z.number().nullable().optional(),
    worstPct: z.number().nullable().optional(),
    maxDrawdownPct: z.number().optional(),
    longestLossStreak: z.number().optional(),
    equity: z
      .array(z.object({ at: z.number().optional(), cumulativePct: z.number().optional() }))
      .optional(),
  })
  .optional();

/** The same trades through a simulated account, so the result reads in money. */
const accountSchema = z
  .object({
    simulated: z.boolean().optional(),
    assumptions: z
      .object({
        capital: z.number().optional(),
        riskPct: z.number().optional(),
        feeBps: z.number().optional(),
        maxLeverage: z.number().optional(),
        sizing: z.enum(["calibrated", "fixed"]).optional(),
        note: z.string().optional(),
      })
      .optional(),
    startingCapital: z.number().optional(),
    endingCapital: z.number().optional(),
    profit: z.number().optional(),
    returnPct: z.number().optional(),
    trades: z.number().optional(),
    wins: z.number().optional(),
    losses: z.number().optional(),
    winRate: rate,
    feesPaid: z.number().optional(),
    maxDrawdownPct: z.number().optional(),
    /** Signals calibrated at a coin flip, declined rather than sized. */
    skipped: z.number().optional(),
    equity: z.array(z.object({ at: z.number().optional(), equity: z.number().optional() })).optional(),
  })
  .optional();

/** One calendar month of resolved signals, oldest first. */
const monthStatsSchema = z.object({
  month: z.string(),
  signals: z.number().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  winRate: rate,
  winRateInterval: interval,
  pnlPct: z.number().optional(),
});

const statsSchema = z.object({
  totalSignals: z.number(),
  activeSignals: z.number().optional(),
  /** Aged out without touching either level — neither a win nor a loss. */
  expired: z.number().optional(),
  resolved: z.number(),
  wins: z.number(),
  losses: z.number(),
  winRate: rate,
  winRateInterval: interval,
  avgConfidence: rate,
  /** Rescaled when a display band is active — not necessarily measured. */
  avgCalibratedConfidence: rate,
  /** The measured average, never rescaled. The one to trust. */
  avgCalibratedMeasured: rate,
  profit: profitSchema,
  account: accountSchema,
  /** The same record cut by month — a long replay read as a history. */
  byMonth: z.array(monthStatsSchema).optional(),
  signalsPerHour: z.number().optional(),
  avgWinPct: z.number().optional(),
  avgLossPct: z.number().optional(),
  /** Matters more than win rate: 72% at a 1:3 payoff still loses money. */
  expectancyPct: z.number().nullable().optional(),
  trendBaseline: rate,
  trendCurrent: rate,
  trendDeltaPp: z.number().nullable().optional(),
  byPair: z
    .array(
      z.object({
        pair: z.string(),
        signals: z.number(),
        wins: z.number(),
        losses: z.number(),
        resolved: z.number(),
        winRate: rate,
        winRateInterval: interval,
      }),
    )
    .optional(),
  calibration: calibrationSchema.optional(),
});

/**
 * The calibration estimate as it stood when a signal opened, computed only
 * from outcomes that had already resolved. Point-in-time, never recomputed.
 */
const signalCalibrationSchema = z
  .object({
    confidence: rate,
    interval,
    intervalWidth: z.number().optional(),
    /** Score bucket, e.g. `75-80`. */
    bin: z.string().optional(),
    samples: z.number().optional(),
    realizedWinRate: rate,
    realizedInterval: interval,
    prior: rate,
    basis: z.enum(["strategy", "declared", "raw"]).optional(),
  })
  .nullable()
  .optional();

const signalSchema = z.object({
  id: z.string(),
  time: z.string().optional(),
  openedAt: z.number().optional(),
  strategy: z.string(),
  strategyName: z.string().optional(),
  pair: z.string(),
  dir: z.enum(["BUY", "SELL"]),
  entry: z.number(),
  tp: z.number(),
  sl: z.number(),
  rr: z.number().optional(),
  /** The raw weighted-component score. Never rewritten. */
  confidence: z.number(),
  /**
   * What that score had historically been worth. Rescaled into the snapshot's
   * `display.confidenceBand` when one is active, so this is a display figure.
   */
  calibratedConfidence: z.number().nullable().optional(),
  /** The measured figure, always. What sizing and every metric actually use. */
  calibratedMeasured: z.number().nullable().optional(),
  /** The print this entered on. Null on replayed history. */
  trigger: tradeRefSchema,
  /** Venue state when it fired, where the feed reports it. */
  market: marketStateSchema,
  calibration: signalCalibrationSchema,
  status: z.enum(["active", "tp_hit", "sl_hit", "expired"]),
  note: z.string().optional(),
  reasons: z.array(z.string()).optional(),
  barsHeld: z.number().optional(),
  exitPrice: z.number().nullable().optional(),
  pnlPct: z.number().nullable().optional(),
  closedAt: z.number().nullable().optional(),
});

const strategySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  timeframe: z.string().nullable().optional(),
  role: z.enum(["base", "higher"]).nullable().optional(),
  /** True when the engine evaluates this strategy on every closed bar. */
  active: z.boolean(),
  /** True when it arrived over the API. Registered strategies are never run. */
  registered: z.boolean(),
  registeredAt: z.number().nullable().optional(),
  updatedAt: z.number().nullable().optional(),
  /** A claimed track record. Never counted as a measurement. */
  declared: z
    .object({ winRate: rate, samples: z.number().optional() })
    .nullable()
    .optional(),
  risk: z
    .object({
      tpAtr: z.number().nullable().optional(),
      slAtr: z.number().nullable().optional(),
      rr: z.number().optional(),
    })
    .nullable()
    .optional(),
  stats: statsSchema,
  calibrationBasis: calibrationBasisSchema,
  recentSignals: z.array(signalSchema).optional(),
});

const snapshotSchema = z.object({
  generatedAt: z.string(),
  uptimeMs: z.number().optional(),
  source: z.string().nullable().optional(),
  /** Markets these stats came from — what was asked for, plus what the source picked. */
  pairs: z.array(z.string()).optional(),
  timeframes: z.array(z.string()).optional(),
  /**
   * Present only when calibrated confidence is being shown rescaled. The
   * mapping is monotonic so ordering survives, and nothing downstream — sizing,
   * filters, the reliability curve, ECE, Brier — uses the rescaled number.
   * Null means the figures are as measured.
   */
  display: z
    .object({
      confidenceBand: z.tuple([z.number(), z.number()]).optional(),
      note: z.string().optional(),
    })
    .nullable()
    .optional(),
  portfolio: statsSchema,
  strategies: z.array(strategySchema),
  strategiesById: z.record(z.string(), strategySchema),
});

const healthSchema = z.object({
  ok: z.boolean(),
  uptimeMs: z.number(),
  /** Market time the stats cover — larger than uptime after a warmup or replay. */
  engineElapsedMs: z.number().optional(),
  source: z.string().nullable().optional(),
  pairs: z.array(z.string()).optional(),
  signals: z.number(),
  streamClients: z.number().optional(),
  persistence: z
    .object({ schema: z.string().optional(), source: z.string().optional() })
    .nullable()
    .optional(),
});

const signalListSchema = z.object({
  /** Matches before `limit` was applied. */
  total: z.number(),
  returned: z.number(),
  signals: z.array(signalSchema),
});

const strategyListSchema = z.object({ strategies: z.array(strategySchema) });

const calibrationReportSchema = z.object({
  generatedAt: z.string().optional(),
  note: z.string().optional(),
  /** Whether calibration survives a restart. */
  persistence: z
    .object({
      enabled: z.boolean().optional(),
      schema: z.string().optional(),
      source: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
  portfolio: calibrationSchema,
  strategies: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      avgConfidence: rate,
      avgCalibratedConfidence: rate,
      winRate: rate,
      winRateInterval: interval,
      basis: calibrationBasisSchema,
      curve: z.array(reliabilityBinSchema).optional(),
      samples: z.number().optional(),
      ece: z.number().nullable().optional(),
      brierRaw: z.number().nullable().optional(),
      brierCalibrated: z.number().nullable().optional(),
    }),
  ),
});

const registerResultSchema = z.object({
  ok: z.boolean(),
  /** False when an existing registration was updated. */
  created: z.boolean(),
  strategy: strategySchema,
  note: z.string().optional(),
});

const reportOutcomesResultSchema = z.object({
  ok: z.boolean(),
  recorded: z
    .object({
      strategy: z.string().optional(),
      bin: z.string().optional(),
      wins: z.number().optional(),
      losses: z.number().optional(),
    })
    .optional(),
  basis: calibrationBasisSchema,
  calibrated: signalCalibrationSchema,
  note: z.string().optional(),
});

export type Stats = z.infer<typeof statsSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type EngineHealth = z.infer<typeof healthSchema>;
export type CalibrationReport = z.infer<typeof calibrationReportSchema>;
export type RegisterStrategyResult = z.infer<typeof registerResultSchema>;
export type ReportOutcomesResult = z.infer<typeof reportOutcomesResultSchema>;
export type SignalStatus = Signal["status"];

/* -------------------------------------------------------------------------- */
/* Request bodies                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What `POST /api/strategies` accepts.
 *
 * Validated here rather than only at the engine so a malformed id fails
 * against the form that produced it instead of arriving as a bare 400. The id
 * pattern is the engine's own.
 */
export const registerStrategySchema = z.object({
  id: z
    .string()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/,
      "Use letters, numbers, dashes and underscores, starting with a letter or number",
    ),
  name: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  timeframe: z.string().max(16).optional(),
  /** A claim, stored as a calibration prior — not as a measured result. */
  winRate: z.number().min(0).max(100).optional(),
  /** How many resolved trades that claim rests on. */
  samples: z.number().int().min(0).optional(),
  risk: z
    .object({ tpAtr: z.number().optional(), slAtr: z.number().optional() })
    .optional(),
});

export type RegisterStrategyInput = z.infer<typeof registerStrategySchema>;

/**
 * What `POST /api/strategies/{id}/outcomes` accepts.
 *
 * `wins`/`losses` and `winRate`/`samples` carry the same evidence, so either
 * is accepted and neither is required on its own — but one of them has to be
 * there or the request records nothing.
 */
export const reportOutcomesSchema = z
  .object({
    /** What score these outcomes were produced at. It selects the bin. */
    confidence: z.number().min(55).max(95),
    wins: z.number().int().min(0).optional(),
    losses: z.number().int().min(0).optional(),
    winRate: z.number().min(0).max(100).optional(),
    samples: z.number().int().min(1).optional(),
  })
  .refine(
    (v) =>
      v.wins !== undefined ||
      v.losses !== undefined ||
      (v.winRate !== undefined && v.samples !== undefined),
    { message: "Send either wins and losses, or a winRate with its samples" },
  );

export type ReportOutcomesInput = z.infer<typeof reportOutcomesSchema>;

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

async function dex<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const base = env.SIGNAL_ENGINE_BASE_URL;
  if (!base) throw new SignalEngineError("The signal engine is not configured");

  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        // Bearer is the documented scheme; the engine takes X-API-Key too.
        ...(env.SIGNAL_ENGINE_API_KEY
          ? { Authorization: `Bearer ${env.SIGNAL_ENGINE_API_KEY}` }
          : {}),
        ...init?.headers,
      },
      // Stats move on every closed bar. A cached feed is a wrong feed.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    // A local engine that is simply not running lands here, which is the
    // common case in development and reads as an outage rather than a bug.
    throw new SignalEngineError(
      `The signal engine at ${base} did not respond`,
      undefined,
      cause instanceof Error ? cause.message : String(cause),
    );
  }

  if (!response.ok) {
    throw new SignalEngineError(
      `Signal engine ${path} failed (${response.status})`,
      response.status,
      await failureDetail(response),
    );
  }

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new SignalEngineError(
      `Signal engine ${path} returned an unexpected shape`,
      response.status,
      parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; "),
    );
  }
  return parsed.data;
}

/** The engine's own explanation of a failure, when it sent one. */
async function failureDetail(response: Response): Promise<string | undefined> {
  const body = await response.text();
  try {
    const parsed = errorSchema.safeParse(JSON.parse(body));
    if (parsed.success) {
      return parsed.data.detail
        ? `${parsed.data.error}: ${parsed.data.detail}`
        : parsed.data.error;
    }
  } catch {
    // Not JSON — the raw body is still the most useful thing to carry up.
  }
  return body.slice(0, 500) || undefined;
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/** The full snapshot: portfolio stats, every strategy, and what it watched. */
export const getSnapshot = () => dex("/api/state", snapshotSchema);

export const getEngineHealth = () => dex("/health", healthSchema);

export const listStrategies = async () =>
  (await dex("/api/strategies", strategyListSchema)).strategies;

export const getStrategy = (id: string) =>
  dex(`/api/strategies/${encodeURIComponent(id)}`, strategySchema);

export const listSignals = (params: {
  status?: SignalStatus;
  strategy?: string;
  /** Case-insensitive, e.g. `BTC/USD`. */
  pair?: string;
  /** 1–1000. `total` still reports the match count before it was applied. */
  limit?: number;
} = {}) => dex(`/api/signals${query(params)}`, signalListSchema);

/** Reliability curves — what confidence claimed against what it delivered. */
export const getCalibration = () =>
  dex("/api/calibration", calibrationReportSchema);

/**
 * Opens the engine's event stream. The caller owns the body and must close it.
 *
 * Deliberately not routed through `dex`: there is no JSON to parse and no
 * timeout to apply, since the whole point of the connection is to stay open
 * and idle until the engine has something to say.
 */
export async function openSignalStream(abort?: AbortSignal): Promise<Response> {
  const base = env.SIGNAL_ENGINE_BASE_URL;
  if (!base) throw new SignalEngineError("The signal engine is not configured");

  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/+$/, "")}/api/stream`, {
      headers: {
        Accept: "text/event-stream",
        ...(env.SIGNAL_ENGINE_API_KEY
          ? { Authorization: `Bearer ${env.SIGNAL_ENGINE_API_KEY}` }
          : {}),
      },
      cache: "no-store",
      signal: abort,
    });
  } catch (cause) {
    throw new SignalEngineError(
      `The signal engine at ${base} did not respond`,
      undefined,
      cause instanceof Error ? cause.message : String(cause),
    );
  }

  if (!response.ok || !response.body) {
    throw new SignalEngineError(
      `Signal engine stream failed (${response.status})`,
      response.status,
      await failureDetail(response),
    );
  }
  return response;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Registers a strategy that lives outside the engine so it can be tracked.
 *
 * A registered strategy is a record, not a participant: it has no `evaluate`,
 * so the engine never fires a signal for it and reports `active: false`. A
 * declared win rate is stored as a prior that seeds the estimate while nothing
 * has been observed, and is overridden the moment real outcomes exist.
 *
 * Registering an id that already exists updates it, which the engine reports
 * as `created: false` — this is not an error and callers should not treat it
 * as one.
 */
export async function registerStrategy(input: RegisterStrategyInput) {
  // `async` so a rejected body surfaces as a rejected promise rather than a
  // synchronous throw from what every caller treats as an awaitable.
  const body = registerStrategySchema.parse(input);
  return dex("/api/strategies", registerResultSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Adds real outcomes to a strategy's calibration.
 *
 * `confidence` is required because it selects the reliability bin: an outcome
 * with no score attached teaches the curve nothing, and filing it under a
 * default would corrupt whichever bin it landed in.
 *
 * Reported outcomes were not resolved under the engine's fill rules, so it
 * tags them `external` and counts them apart from its own.
 */
export async function reportOutcomes(id: string, input: ReportOutcomesInput) {
  const body = reportOutcomesSchema.parse(input);
  return dex(
    `/api/strategies/${encodeURIComponent(id)}/outcomes`,
    reportOutcomesResultSchema,
    { method: "POST", body: JSON.stringify(body) },
  );
}
