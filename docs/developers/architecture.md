---
description: The stack, how the pieces fit, and the decisions worth knowing about.
---

# Architecture

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 — App Router, Turbopack, React 19 |
| Styling | Tailwind CSS v4, CSS-first config with design tokens |
| Components | shadcn/ui on Radix, Lucide icons |
| Client state | Zustand, synced from the session |
| Server state | TanStack Query |
| Auth | Auth.js (NextAuth v5) with the Prisma adapter |
| Database | PostgreSQL via Prisma |
| Animation | GSAP + ScrollTrigger, with Lenis smooth scroll on the GSAP ticker |
| Theming | next-themes — light / dark / system |
| Env validation | Zod, in `lib/env.ts` |

## Layout

```
app/            App Router routes, server actions, root layout
  api/          Route handlers — webhooks, streams, health
  dashboard/    The authenticated application
components/
  ui/           shadcn/ui primitives
  dashboard/    Dashboard screens
  landing/      Marketing site
  marketing/    Shared shell for standalone marketing pages
lib/            Domain logic — env, prisma, catalogue, referral, kyc, deposit…
prisma/         Schema and seed
proxy.ts        Auth middleware (Next 16 renamed `middleware` to `proxy`)
docs/           This documentation
```

## Where the logic lives

Business rules live in `lib/`, not in components. Two rules explain most of the structure:

**Prices live in exactly one place.** `lib/catalogue.ts` holds every purchasable item and its price, so a purchase takes an **id** and looks the amount up server-side. Anything that trusted a browser-supplied amount would let a caller name their own price.

**Purchase logic is session-free.** `lib/purchase.ts` takes a user id, not a session. A click carries a signed-in user; a crypto checkout settles from a webhook where there is nobody to read. Both must debit and grant identically, and the webhook path must not have to import the auth stack.

## Auth

Two NextAuth instances, deliberately:

| Instance | Where | Why |
| --- | --- | --- |
| `auth.ts` | Node runtime | Full config — Prisma adapter, credentials provider |
| `proxy.ts` | Edge | `auth.config.ts` only, so Prisma and Node crypto stay out of the edge bundle |

Both share `auth.config.ts`, so the proxy validates tokens against the same window the handlers issue them with.

Sessions are **JWT**. The cookie always carries the longer 30-day lifetime; a shorter session is enforced by an `expiresAt` timestamp inside the token, because a JWT cannot expire when a browser closes.

## Streams

Two server-sent event endpoints push updates without polling:

| Endpoint | Pushes |
| --- | --- |
| `/api/deposit/stream` | Deposit state transitions |
| `/api/signal-engine/stream` | Live signals |

## The signal engine is a separate process

`lib/signal-engine.ts` talks to it over HTTP — one `fetch` per call, no SDK, 5-second timeout. With no engine configured, the UI reports "not connected" rather than rendering sample data.

{% hint style="success" %}
**This API places no orders.** Nothing reachable through it can move money — the separation is structural, not configuration.
{% endhint %}

## Money

* Amounts are **fixed-precision decimals**, never floats.
* Referral rates are **basis points** — 5% of $29 must be exact, and `0.05 * 29` is not.
* Balances are **derived from ledger entries**, not stored as a counter.
* Debit and grant happen in **one transaction**, with write-conflict retry.

## Rendering

The root layout awaits `auth()`, which opts every route into on-demand rendering. Static param lists exist where they would help (`generateStaticParams` on blog posts), so pages become statically generated if that ever changes.

## Related

* [API reference](/api-reference/analyses/start-an-analysis)
* [Webhooks](webhooks.md)
