import { getHealth } from "@/lib/health";

/**
 * The uptime probe, for an external monitor and the public status page it feeds.
 *
 * Unauthenticated on purpose. A monitor has no session, and anything it cannot
 * reach it records as an outage — so a signed-in health check would report a
 * permanent one. Nothing here is account data: it is whether this deployment
 * can currently reach its own dependencies.
 *
 * A `down` result is a 503 so that a plain status-code monitor catches it.
 * `degraded` stays a 200, because the site is still serving and turning every
 * component red would state something untrue; to watch the signal engine on its
 * own, point a second monitor at this URL with a body check on
 * `checks.signalEngine.status`.
 */

// A health check Next renders once at build time reports the health of the
// build machine, forever.
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getHealth();

  return Response.json(health, {
    status: health.status === "down" ? 503 : 200,
    headers: {
      // A CDN holding a 200 in front of a dead origin makes the status page lie.
      "cache-control": "no-store, max-age=0",
    },
  });
}
