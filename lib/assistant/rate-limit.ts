// Simple in-memory, per-IP fixed-window rate limiter for the assistant endpoint.
// No dependencies. Caveat: state is per-process, so on multi-instance serverless
// each instance keeps its own counter — swap in Redis (e.g. @upstash/ratelimit)
// if you deploy at scale. Good enough to stop a single client hammering the API.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20; // per IP per window

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || entry.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // opportunistic cleanup so the map can't grow unbounded
    if (buckets.size > 5000) {
      for (const [key, val] of buckets) if (val.resetAt <= now) buckets.delete(key);
    }
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}
