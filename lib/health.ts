import prisma from "@/lib/prisma";
import {
  SignalEngineError,
  getEngineHealth,
  isSignalEngineConfigured,
} from "@/lib/signal-engine";

/**
 * The probe an external uptime monitor reads.
 *
 * Two properties of that caller shape everything below.
 *
 * It is anonymous, so this must not become the outage it was meant to report.
 * A monitor cannot sign in, which leaves the endpoint public, which would
 * otherwise make every request cost a database round trip and an upstream
 * fetch — and a few thousand of those drain the connection pool the rest of the
 * app is waiting on. Concurrent callers join one probe and the result is shared
 * for a few seconds after, so the load here is bounded by time rather than by
 * request volume.
 *
 * It is untrusted, so nothing sensitive may ride along. The failure detail a
 * dependency hands up names hosts, ports and connection strings; that goes to
 * the log, and the response carries a word for what went wrong instead.
 */

/** `not_configured` is a dependency this deployment was never given. */
export type ComponentStatus = "up" | "down" | "not_configured";

export type ComponentHealth = {
  status: ComponentStatus;
  /** Zero for a dependency that was never contacted. */
  latencyMs: number;
  /** Deliberately coarse — see the note on leaking above. */
  error?: string;
};

/**
 * `degraded` means the site is serving and one part of it is not, which is why
 * it is not an outage. Only `down` says the app cannot do its job at all.
 */
export type Health = {
  status: "ok" | "degraded" | "down";
  checkedAt: string;
  durationMs: number;
  checks: {
    database: ComponentHealth;
    signalEngine: ComponentHealth;
  };
};

/** The signal engine client's own timeout, so neither probe outlives the other. */
const PROBE_TIMEOUT_MS = 5_000;

/**
 * Long enough that a flood collapses into a handful of real probes, short
 * enough that a monitor polling by the minute never reads a stale answer.
 */
const SHARE_RESULT_MS = 3_000;

let latest: { at: number; health: Health } | null = null;
let pending: Promise<Health> | null = null;

export function getHealth(): Promise<Health> {
  if (latest && Date.now() - latest.at < SHARE_RESULT_MS) {
    return Promise.resolve(latest.health);
  }
  // A request arriving mid-probe waits on that probe rather than starting a
  // second one. Without this the shared result above has a hole in it exactly
  // where it matters: the window a burst of traffic lands in.
  pending ??= probeAll().finally(() => {
    pending = null;
  });
  return pending;
}

async function probeAll(): Promise<Health> {
  const startedAt = performance.now();
  const [database, signalEngine] = await Promise.all([
    probeDatabase(),
    probeSignalEngine(),
  ]);

  const health: Health = {
    status: overallStatus(database, signalEngine),
    checkedAt: new Date().toISOString(),
    durationMs: elapsedMs(startedAt),
    checks: { database, signalEngine },
  };
  latest = { at: Date.now(), health };
  return health;
}

/**
 * The database is the app: without it nothing renders and nothing is stored.
 * The engine is one screen, and that screen is built to say it is not connected
 * rather than to fall over — so its absence is reported without being called an
 * outage of everything else.
 */
function overallStatus(
  database: ComponentHealth,
  signalEngine: ComponentHealth,
): Health["status"] {
  if (database.status === "down") return "down";
  if (signalEngine.status === "down") return "degraded";
  return "ok";
}

async function probeDatabase(): Promise<ComponentHealth> {
  const startedAt = performance.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`);
    return { status: "up", latencyMs: elapsedMs(startedAt) };
  } catch (cause) {
    console.error("[health] database probe failed:", cause);
    return {
      status: "down",
      latencyMs: elapsedMs(startedAt),
      error: cause instanceof ProbeTimeout ? "timed out" : "unreachable",
    };
  }
}

async function probeSignalEngine(): Promise<ComponentHealth> {
  if (!isSignalEngineConfigured()) {
    return { status: "not_configured", latencyMs: 0 };
  }

  const startedAt = performance.now();
  try {
    // The engine client already aborts at PROBE_TIMEOUT_MS of its own accord,
    // so this call needs no second clock around it.
    const { ok } = await getEngineHealth();
    if (!ok) {
      return {
        status: "down",
        latencyMs: elapsedMs(startedAt),
        error: "reported unhealthy",
      };
    }
    return { status: "up", latencyMs: elapsedMs(startedAt) };
  } catch (cause) {
    console.error("[health] signal engine probe failed:", cause);
    return {
      status: "down",
      latencyMs: elapsedMs(startedAt),
      // A status is set only when the engine answered, which is the difference
      // between a process that is gone and one that is running and broken.
      error:
        cause instanceof SignalEngineError && cause.status !== undefined
          ? `responded ${cause.status}`
          : "unreachable",
    };
  }
}

class ProbeTimeout extends Error {
  constructor() {
    super("probe timed out");
    this.name = "ProbeTimeout";
  }
}

/**
 * Prisma has no cancellation, so the query this race abandons still runs to
 * completion against the pool. Bounding the answer is the point: a monitor
 * waiting on a wedged database learns nothing that the timeout has not already
 * told it, and a probe with no ceiling is a probe that hangs.
 */
function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    work,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ProbeTimeout()), PROBE_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

const elapsedMs = (startedAt: number) =>
  Math.round(performance.now() - startedAt);
