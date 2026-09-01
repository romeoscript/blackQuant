---
title: What MEV Actually Is, Without the Mystique
excerpt: Maximal Extractable Value gets described either as free money or as theft. It is neither — it is the price of running an auction in public. Here is the mechanism, end to end.
category: Research
author: research
date: 2026-08-14
tags: [MEV, Ethereum, Market Structure]
featured: true
---

Most explanations of MEV start with a sandwich attack and stop there. That is a
symptom, not the mechanism. To understand why extractable value exists at all,
start with a duller observation: **a blockchain is an auction where everyone can
see the bids.**

## The mempool is a queue you can read

When you submit a transaction, it does not go straight into a block. It goes
into the mempool — a shared waiting room that every node on the network can
read. Your intent is public before it is final.

That gap between *announced* and *settled* is the entire opportunity. Anyone
watching the mempool knows what you are about to do, and — because block
builders order transactions by fee rather than by arrival time — they can pay to
act on it first.

> MEV is not a bug in a particular protocol. It is what happens when you run a
> sealed-bid market with the envelopes open.

## Where the value actually comes from

Extractable value shows up in three broad shapes, and they are not morally
equivalent:

- **Arbitrage.** The same asset trades at different prices on two venues. Buying
  the cheap one and selling the dear one moves them back together. This is the
  boring, useful kind — it is how prices stay consistent across a fragmented
  market.
- **Liquidations.** An undercollateralised loan needs closing. Protocols pay a
  bounty for whoever does it, because the alternative is bad debt.
- **Sandwiching.** A searcher sees your large swap, buys ahead of it, lets your
  order push the price up, and sells into it. Your slippage is their margin.
  This one is a genuine tax on the user.

The first two make markets work. The third is a transfer from you to someone
faster. Conflating them is why the conversation goes nowhere.

## A concrete example

Suppose ETH trades at 2,000 USDC on one pool and 2,006 on another. The
opportunity is the spread, minus the cost of taking it:

```ts
const spread = (sell - buy) * size;          // gross edge
const cost   = gasPrice * gasUsed + fees;    // cost to capture it
const edge   = spread - cost;                // what is actually left

if (edge > MIN_EDGE) submit(bundle);
```

That subtraction is the whole game. The gross spread is visible to everyone
watching the same two pools. What separates a profitable searcher from an
unprofitable one is the second line — and the second line is mostly
infrastructure.

## Why latency decides the outcome

If ten actors see the same 6 USDC spread, the one who lands their bundle in the
block captures it and the rest have burned gas on a reverted transaction. The
edge is not the idea. The edge is arriving.

| Stage | Typical budget | What dominates it |
| --- | --- | --- |
| Detect the opportunity | 1–2 ms | Node proximity, mempool subscription |
| Simulate the route | 1–3 ms | Local state, warm caches |
| Sign and submit | 1–2 ms | Key handling, builder connection |

Nothing on that list is clever. It is all engineering — where your nodes sit,
whether your state is warm, how many hops stand between the decision and the
builder. Which is the uncomfortable conclusion of most MEV research: the
strategy is usually public, and the moat is usually plumbing.

## What this means if you are not a searcher

Two practical things.

First, **your slippage tolerance is a bid.** Setting it to 5% on a large swap
advertises exactly how much someone may take from you. Tighten it and accept the
occasional failed transaction.

Second, **private routing removes the announcement.** If your transaction never
touches the public mempool and goes straight to a builder, there is no window in
which to front-run it. That is not a clever trick; it is just declining to
publish your intent early.

MEV is not going away, because the thing that produces it — a public, ordered,
fee-priced ledger — is the thing that makes the ledger work. What can change is
who is positioned to capture it, and whether the capture comes out of your
trade or out of a price discrepancy that needed correcting anyway.
