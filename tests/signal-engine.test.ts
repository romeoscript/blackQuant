import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The signal engine client, against a stubbed transport.
 *
 * These are unit tests on purpose: the engine is a separate process that may
 * not be running, and the behaviour worth pinning down is what this side does
 * with what comes back — that an unmeasured win rate stays null instead of
 * becoming a confident zero, that a malformed strategy id never reaches the
 * network, and that an engine which is simply down is reported as down rather
 * than as a bug.
 */

// Hoisted above the import below, so the client reads a configured engine
// without the suite depending on what the developer has in .env.
vi.mock("@/lib/env", () => ({
  env: {
    SIGNAL_ENGINE_BASE_URL: "http://engine.test:8820/",
    SIGNAL_ENGINE_API_KEY: "test-engine-key",
  },
}));

import {
  SignalEngineError,
  getSnapshot,
  hourlyVolume,
  listSignals,
  registerStrategy,
  reportOutcomes,
  type Signal,
} from "@/lib/signal-engine";

const HOUR_MS = 3_600_000;

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const json = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

const stats = (over: Record<string, unknown> = {}) => ({
  totalSignals: 0,
  resolved: 0,
  wins: 0,
  losses: 0,
  winRate: null,
  ...over,
});

const signal = (over: Partial<Signal> = {}): Signal =>
  ({
    id: "sig-1",
    strategy: "momentum",
    pair: "BTC/USD",
    dir: "BUY",
    entry: 64850,
    tp: 66400,
    sl: 63900,
    confidence: 74,
    status: "active",
    ...over,
  }) as Signal;

/** The last request the client made, as (url, init). */
const lastCall = () => {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error("expected a request to have been made");
  return { url: String(call[0]), init: call[1] as RequestInit };
};

describe("transport", () => {
  it("joins the base url without doubling the slash and sends the key", async () => {
    json({ total: 0, returned: 0, signals: [] });

    await listSignals();

    const { url, init } = lastCall();
    expect(url).toBe("http://engine.test:8820/api/signals");
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer test-engine-key",
    );
    // Stats move every closed bar, so a cached read is a wrong read.
    expect(init.cache).toBe("no-store");
  });

  it("puts only the filters that were set on the query string", async () => {
    json({ total: 0, returned: 0, signals: [] });

    await listSignals({ status: "tp_hit", pair: "BTC/USD", limit: 50 });

    const { url } = lastCall();
    const query = new URL(url).searchParams;
    expect(query.get("status")).toBe("tp_hit");
    expect(query.get("pair")).toBe("BTC/USD");
    expect(query.get("limit")).toBe("50");
    expect(query.has("strategy")).toBe(false);
  });

  it("reports an engine that is not running as unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const failure = await getSnapshot().catch((e) => e);

    expect(failure).toBeInstanceOf(SignalEngineError);
    expect(failure.message).toMatch(/did not respond/);
    // The cause is kept for the log rather than dropped.
    expect(failure.detail).toBe("ECONNREFUSED");
  });

  it("carries the engine's own explanation up with the status", async () => {
    json({ error: "conflict", detail: "momentum is a built-in strategy" }, 409);

    const failure = await registerStrategy({ id: "momentum" }).catch((e) => e);

    expect(failure).toBeInstanceOf(SignalEngineError);
    expect(failure.status).toBe(409);
    expect(failure.detail).toBe("conflict: momentum is a built-in strategy");
  });

  it("rejects a response that does not match the documented shape", async () => {
    // `resolved` missing: a partial payload silently becoming NaN downstream
    // is exactly the failure this parse exists to stop.
    json({ generatedAt: "now", portfolio: { totalSignals: 3 }, strategies: [], strategiesById: {} });

    await expect(getSnapshot()).rejects.toThrow(/unexpected shape/);
  });
});

describe("unmeasured rates", () => {
  it("keeps a null win rate null rather than defaulting it to zero", async () => {
    json({
      generatedAt: "2026-08-09T10:00:00.000Z",
      portfolio: stats({ totalSignals: 4, winRate: null }),
      strategies: [
        {
          id: "swing",
          name: "Swing",
          active: false,
          registered: true,
          declared: { winRate: 72, samples: 140 },
          stats: stats(),
        },
      ],
      strategiesById: {},
    });

    const snapshot = await getSnapshot();

    expect(snapshot.portfolio.winRate).toBeNull();
    expect(snapshot.strategies[0].stats.winRate).toBeNull();
    // The claim survives, and stays on `declared` where it cannot be read as
    // something the engine measured.
    expect(snapshot.strategies[0].declared?.winRate).toBe(72);
  });

  it("keeps the credible interval attached to the rate it qualifies", async () => {
    json({
      generatedAt: "2026-08-09T10:00:00.000Z",
      portfolio: stats({ resolved: 400, wins: 300, winRate: 75, winRateInterval: [70.6, 78.9] }),
      strategies: [],
      strategiesById: {},
    });

    const snapshot = await getSnapshot();

    expect(snapshot.portfolio.winRateInterval).toEqual([70.6, 78.9]);
  });
});

describe("registerStrategy", () => {
  it("posts the declared record and reports a fresh registration", async () => {
    json(
      {
        ok: true,
        created: true,
        strategy: {
          id: "swing-reversal",
          name: "Swing Reversal",
          active: false,
          registered: true,
          stats: stats(),
        },
      },
      201,
    );

    const result = await registerStrategy({
      id: "swing-reversal",
      name: "Swing Reversal",
      timeframe: "4h",
      winRate: 68.5,
      samples: 240,
      risk: { tpAtr: 2, slAtr: 1 },
    });

    const { url, init } = lastCall();
    expect(url).toBe("http://engine.test:8820/api/strategies");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      id: "swing-reversal",
      name: "Swing Reversal",
      timeframe: "4h",
      winRate: 68.5,
      samples: 240,
      risk: { tpAtr: 2, slAtr: 1 },
    });
    expect(result.created).toBe(true);
    // A registered strategy is a record, not a participant.
    expect(result.strategy.active).toBe(false);
  });

  it("treats a repeat registration as the update the engine says it is", async () => {
    json({
      ok: true,
      created: false,
      strategy: {
        id: "swing-reversal",
        name: "Swing Reversal",
        active: false,
        registered: true,
        stats: stats(),
      },
      note: "already registered",
    });

    await expect(registerStrategy({ id: "swing-reversal" })).resolves.toMatchObject({
      created: false,
    });
  });

  it("refuses a malformed id before it reaches the network", async () => {
    await expect(registerStrategy({ id: "-nope!" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a declared rate outside 0-100 before it reaches the network", async () => {
    await expect(
      registerStrategy({ id: "swing", winRate: 140 }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("reportOutcomes", () => {
  it("posts wins and losses to the strategy's bin", async () => {
    json({ ok: true, recorded: { strategy: "swing", bin: "70-75", wins: 7, losses: 3 } }, 202);

    const result = await reportOutcomes("swing", { confidence: 72, wins: 7, losses: 3 });

    const { url, init } = lastCall();
    expect(url).toBe("http://engine.test:8820/api/strategies/swing/outcomes");
    expect(JSON.parse(String(init.body))).toEqual({ confidence: 72, wins: 7, losses: 3 });
    expect(result.recorded?.bin).toBe("70-75");
  });

  it("accepts the rate-and-samples form as the same evidence", async () => {
    json({ ok: true }, 202);

    await reportOutcomes("swing", { confidence: 80, winRate: 70, samples: 100 });

    expect(JSON.parse(String(lastCall().init.body))).toEqual({
      confidence: 80,
      winRate: 70,
      samples: 100,
    });
  });

  it("refuses outcomes with no wins, losses or rate attached", async () => {
    await expect(reportOutcomes("swing", { confidence: 72 })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a confidence outside the engine's scoring range", async () => {
    // The score selects the reliability bin, so one the engine never emits
    // would land these outcomes in a bin that does not exist.
    await expect(
      reportOutcomes("swing", { confidence: 20, wins: 5 }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escapes an id that would otherwise reshape the path", async () => {
    json({ ok: true }, 202);

    await reportOutcomes("a/b", { confidence: 60, wins: 1 });

    expect(lastCall().url).toBe(
      "http://engine.test:8820/api/strategies/a%2Fb/outcomes",
    );
  });
});

describe("hourlyVolume", () => {
  const now = Date.UTC(2026, 7, 9, 14, 30);
  const hourAgo = (n: number) => now - n * HOUR_MS;

  it("emits an unbroken axis, quiet hours included", () => {
    const buckets = hourlyVolume([], now, 6);

    expect(buckets).toHaveLength(6);
    expect(buckets.every((b) => b.signals === 0)).toBe(true);
    // Oldest first, current hour last.
    expect(buckets[0].hour).toBe("09");
    expect(buckets.at(-1)?.hour).toBe("14");
  });

  it("counts each signal into the hour it opened", () => {
    const buckets = hourlyVolume(
      [
        signal({ id: "a", openedAt: now }),
        signal({ id: "b", openedAt: now - 60_000 }),
        signal({ id: "c", openedAt: hourAgo(2) }),
        signal({ id: "d", openedAt: hourAgo(2) + 5_000 }),
      ],
      now,
      6,
    );

    expect(buckets.at(-1)?.signals).toBe(2);
    expect(buckets.at(-3)?.signals).toBe(2);
    expect(buckets.reduce((sum, b) => sum + b.signals, 0)).toBe(4);
  });

  it("drops what it cannot place instead of inventing activity", () => {
    const buckets = hourlyVolume(
      [
        // Older than the window.
        signal({ id: "old", openedAt: hourAgo(30) }),
        // No open time at all — counting it anywhere would be a guess.
        signal({ id: "timeless" }),
      ],
      now,
      6,
    );

    expect(buckets.reduce((sum, b) => sum + b.signals, 0)).toBe(0);
  });
});
