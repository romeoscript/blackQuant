import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The uptime probe, against stubbed dependencies.
 *
 * The rest of this suite runs against a real Postgres because mocking a
 * database would only assert the mock. Here the failure *is* the subject: what
 * the probe reports when Postgres is gone, when the engine is gone, and when
 * the engine was never configured cannot be produced against a live one.
 *
 * The endpoint is public, so what it declines to say matters as much as what it
 * says — the leak test below is not decoration.
 */

const { queryRaw, engineHealth, engineConfigured } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  engineHealth: vi.fn(),
  engineConfigured: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: { $queryRaw: queryRaw },
}));

// The real module, with only the two calls the probe makes replaced: it throws
// `SignalEngineError`, and the probe reads that class to tell an engine that is
// gone from one that answered badly.
vi.mock("@/lib/signal-engine", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/signal-engine")>()),
  getEngineHealth: engineHealth,
  isSignalEngineConfigured: engineConfigured,
}));

import { SignalEngineError } from "@/lib/signal-engine";
import type { Health } from "@/lib/health";

/** The engine's address, as it appears in the errors the client raises. */
const ENGINE_ORIGIN = "engine.internal:8820";

let getHealth: () => Promise<Health>;

beforeEach(async () => {
  // The probe shares its last result for a few seconds, so each test needs a
  // module with an empty cache rather than the previous test's answer.
  vi.resetModules();

  queryRaw.mockReset().mockResolvedValue([{ ok: 1 }]);
  engineHealth.mockReset().mockResolvedValue({ ok: true, uptimeMs: 1, signals: 0 });
  engineConfigured.mockReset().mockReturnValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  ({ getHealth } = await import("@/lib/health"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getHealth", () => {
  it("is ok when both dependencies answer", async () => {
    const health = await getHealth();

    expect(health.status).toBe("ok");
    expect(health.checks.database.status).toBe("up");
    expect(health.checks.signalEngine.status).toBe("up");
    expect(Date.parse(health.checkedAt)).not.toBeNaN();
  });

  it("is down when the database is unreachable", async () => {
    queryRaw.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.4:5432"));

    const health = await getHealth();

    expect(health.status).toBe("down");
    expect(health.checks.database).toMatchObject({
      status: "down",
      error: "unreachable",
    });
  });

  it("is degraded, not down, when only the signal engine is unreachable", async () => {
    engineHealth.mockRejectedValue(
      new SignalEngineError(`The signal engine at http://${ENGINE_ORIGIN} did not respond`),
    );

    const health = await getHealth();

    expect(health.status).toBe("degraded");
    expect(health.checks.database.status).toBe("up");
    expect(health.checks.signalEngine).toMatchObject({
      status: "down",
      error: "unreachable",
    });
  });

  it("separates an engine that answered badly from one that is gone", async () => {
    engineHealth.mockRejectedValue(
      new SignalEngineError("Signal engine /health failed (502)", 502),
    );

    const health = await getHealth();

    expect(health.checks.signalEngine.error).toBe("responded 502");
  });

  it("is degraded when the engine answers but calls itself unhealthy", async () => {
    engineHealth.mockResolvedValue({ ok: false, uptimeMs: 1, signals: 0 });

    const health = await getHealth();

    expect(health.status).toBe("degraded");
    expect(health.checks.signalEngine).toMatchObject({
      status: "down",
      error: "reported unhealthy",
    });
  });

  it("stays ok when no engine was configured, rather than calling it an outage", async () => {
    engineConfigured.mockReturnValue(false);

    const health = await getHealth();

    expect(health.status).toBe("ok");
    expect(health.checks.signalEngine).toEqual({
      status: "not_configured",
      latencyMs: 0,
    });
    expect(engineHealth).not.toHaveBeenCalled();
  });

  it("publishes no infrastructure detail from a failure", async () => {
    queryRaw.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.4:5432"));
    engineHealth.mockRejectedValue(
      new SignalEngineError(
        `The signal engine at http://${ENGINE_ORIGIN} did not respond`,
        undefined,
        "getaddrinfo ENOTFOUND engine.internal",
      ),
    );

    const body = JSON.stringify(await getHealth());

    expect(body).not.toContain(ENGINE_ORIGIN);
    expect(body).not.toContain("ECONNREFUSED");
    expect(body).not.toContain("10.0.0.4");
  });

  it("collapses concurrent callers onto a single probe", async () => {
    const [first, second] = await Promise.all([getHealth(), getHealth()]);

    expect(first).toBe(second);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("reuses that probe for the requests that follow it", async () => {
    await getHealth();
    await getHealth();

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(engineHealth).toHaveBeenCalledTimes(1);
  });
});
