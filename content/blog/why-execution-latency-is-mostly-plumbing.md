---
title: Why Execution Latency Is Mostly Plumbing
excerpt: Sub-5ms is not a clever algorithm. It is a budget, spent across six stages, where the wins come from removing hops rather than optimising code.
category: Engineering
author: engineering
date: 2026-05-30
tags: [Latency, Infrastructure, Execution]
---

When a strategy is public — and most are — the difference between capturing an
opportunity and paying gas for a reverted transaction is arrival time. So it is
worth being precise about where that time goes, because the instinct to optimise
code is usually pointed at the wrong stage.

## The budget

A 5 ms round trip from signal to submission, in rough proportions:

| Stage | Budget | Dominated by |
| --- | --- | --- |
| Event arrives from node | 0.5–1.5 ms | Physical distance |
| Decode and filter | 0.1–0.3 ms | Allocation, not parsing |
| Simulate the route | 1.0–2.0 ms | State locality |
| Risk checks | 0.1–0.2 ms | Nothing, if done right |
| Sign | 0.2–0.5 ms | Key access pattern |
| Submit to builder | 0.5–1.5 ms | Connection reuse |

Two things stand out. The largest entries are network and state — not
computation. And the stage most people spend their time on, decoding, is the
smallest line on the list.

## Distance is not negotiable

Light in fibre covers roughly 200 km per millisecond, and real routes are not
straight. A node 900 km away costs about 9 ms round trip before anything is
computed. No amount of profiling recovers that.

This is why colocation is the first decision, not a later optimisation. The
cheapest millisecond is the one you never spend travelling.

## Allocation, not parsing

Decoding events is cheap. Allocating for every event is not — because the cost
does not show up in the decode, it shows up later as a garbage collection pause
in the middle of an opportunity.

```ts
// Allocates per event; the cost arrives later, as a pause.
const logs = events.map((e) => ({ ...decode(e), receivedAt: Date.now() }));

// Reuses one buffer; steady-state allocation approaches zero.
for (const event of events) {
  decodeInto(scratch, event);
  if (!isRelevant(scratch)) continue;
  handle(scratch);
}
```

The second version is not faster per event in a microbenchmark. It is faster at
the 99th percentile, which is the only percentile that matters when you are
racing.

## Simulation wants warm state

Simulating a route means answering "what would this trade do given current pool
reserves?" If that answer requires an RPC call, the stage costs 20 ms instead of
2 and the budget is gone.

The fix is to hold the state you need in memory and update it from the event
stream, so simulation is arithmetic on local values. This is the single largest
win available, and it is a data-plumbing decision rather than an algorithmic one.

## The hop nobody counts

Every abstraction between decision and network is time. A queue that batches for
1 ms costs 1 ms. A retry wrapper that adds a promise tick costs a tick. A logger
that serialises the bundle synchronously before submitting costs the
serialisation.

None of these are wrong. They are all invisible on a flame graph aggregated over
a minute, and all clearly visible when you timestamp a single path end to end.

> Measure one request through every stage, not a thousand requests in aggregate.
> Averages hide exactly the hop you are looking for.

## Failure is a latency problem too

A submission path that retries on failure has two budgets: the fast path and the
recovery path. If a builder connection drops and reconnection takes 200 ms, the
strategy is effectively offline for forty opportunities.

So connections are held open and health-checked continuously, and a failed
submission fails over to an already-warm alternative rather than dialling one.
The recovery path has to be nearly as fast as the happy path, because from the
market's point of view there is no difference between being slow and being
absent.

## What this means in practice

If you are trying to get faster, the order of attack is:

1. **Move closer.** Physical distance beats every code change.
2. **Keep state local.** Turn network calls into memory reads.
3. **Stop allocating** on the hot path.
4. **Remove hops.** Count every layer between decision and socket.
5. *Then* optimise the code.

Most teams start at five. Almost all of the available time is in one through
four — which is a slightly deflating conclusion, because it means the
competitive edge in execution is rarely intellectual. It is just carefully
removed overhead.
