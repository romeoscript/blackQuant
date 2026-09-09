---
description: The HTTP endpoints this application exposes.
---

# API reference

Most of the application is built on **server actions** rather than a public REST API, so the HTTP surface is deliberately small: webhooks, streams, health and auth.

## `GET /api/health`

The uptime probe. **Unauthenticated on purpose** — a monitor has no session, and anything it cannot reach it records as an outage, so a signed-in health check would report a permanent one.

Nothing here is account data. It reports whether the deployment can currently reach its own dependencies.

**Response**

```json
{
  "status": "ok",
  "checks": {
    "database":     { "status": "up", "latencyMs": 12 },
    "signalEngine": { "status": "not_configured", "latencyMs": 0 }
  }
}
```

| Overall `status` | HTTP | Meaning |
| --- | --- | --- |
| `ok` | 200 | Everything reachable |
| `degraded` | **200** | A component is down; the site still serves |
| `down` | **503** | The deployment cannot serve |

| Component `status` | Meaning |
| --- | --- |
| `up` | Reachable |
| `down` | Configured but unreachable |
| `not_configured` | No configuration — not an error |

{% hint style="info" %}
`degraded` stays **200** on purpose: the site is still serving, and turning every component red would state something untrue. To alert on the signal engine specifically, point a second monitor at this URL with a body check on `checks.signalEngine.status`.

The response is sent `no-store`. A CDN holding a 200 in front of a dead origin makes a status page lie.
{% endhint %}

## `POST /api/deposit/ipn`

The payment processor callback. See [Webhooks](webhooks.md) — it has its own page because the signature verification is the security boundary of the whole deposit path.

## `GET /api/deposit/stream`

Server-sent events for deposit state transitions. Authenticated; scoped to the current user.

```javascript
const es = new EventSource("/api/deposit/stream");
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

## `GET /api/signal-engine/stream`

Server-sent events for live signals. Authenticated, and requires an active [signal plan](../billing/plans-and-pricing.md).

## `GET|POST /api/auth/[...nextauth]`

Auth.js handlers — sign-in, callback, session, CSRF, sign-out. Excluded from the proxy matcher so the auth flow is never intercepted by its own middleware.

## `GET /api/avatar`

Serves the signed-in user's avatar.

## `POST /api/assistant`

Backs the in-app assistant. Answers from the indexed knowledge base rather than general knowledge.

## `GET /ref/{code}`

Stores a referral code in a cookie for **30 days**, then redirects to the site. See [Referral Hub](../platform/referral-hub.md).

Codes are eight characters from an alphabet excluding `0`, `o`, `1`, `l` and `i`. Anything that could not be one of ours is rejected before it reaches a query.

## `GET /blog/feed.xml`

RSS feed for the blog.

## Programmatic access

API access is listed as an **Elite** plan feature. There is no public REST API for account operations today — the dashboard uses server actions, which are not a stable external contract.

{% hint style="warning" %}
Do not build integrations against server action endpoints. They are internal, unversioned, and change without notice.
{% endhint %}

## Related

* [Webhooks](webhooks.md)
* [Architecture](architecture.md)
