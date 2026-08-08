// Simple in-memory fixed-window rate limiter. No dependencies. Caveat: state is
// per-process, so on multi-instance serverless each instance keeps its own
// counter — swap in Redis (e.g. @upstash/ratelimit) if you deploy at scale.
// Good enough to stop a single client hammering an endpoint.

export type Limit = { windowMs: number; max: number };

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

/**
 * `key` is whatever the caller is limiting on — an IP for anonymous endpoints,
 * a user id for authenticated ones. Prefix it per endpoint so two callers with
 * different limits cannot share a bucket.
 */
export function rateLimit(
  key: string,
  { windowMs, max }: Limit,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // opportunistic cleanup so the map can't grow unbounded
    if (buckets.size > 5000) {
      for (const [k, val] of buckets) if (val.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= max) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}
