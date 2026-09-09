---
description: Open and closed positions, the equity curve, and P&L broken down by pair.
---

# Positions

**Apps → Positions.** Everything you have opened, what it did, and what it is doing now.

## What is on the screen

| Block | Shows |
| --- | --- |
| Stat cards | Headline figures — open count, realised and unrealised P&L |
| Equity curve | Account equity over time |
| P&L by pair | Which pairs made and lost money |
| Positions table | Every position, open and closed |

## Position limits

How many positions you can hold concurrently is set by your [signal plan](../billing/plans-and-pricing.md):

| Tier | Concurrent positions |
| --- | --- |
| Starter | 1 |
| Growth | 5 |
| Elite | Unlimited |

Each **Extra Positions Slot** [add-on](../billing/add-ons.md) raises the limit by one. Buying one on Elite does nothing, since Elite is already unlimited.

## Opening a position

Use **Trade** in the page header. You will be asked for the pair, the side and the size.

{% hint style="warning" %}
A signal is an observation, not an instruction. The [Signal Engine](signal-engine.md) publishes what it has measured; sizing and the decision to act are yours. Read the credible interval on a strategy before sizing against it.
{% endhint %}

## Reading the equity curve

The curve is **account equity over time**, not cumulative P&L — so deposits and withdrawals move it as well as trading results. A step up that coincides with a deposit is not a winning trade.

To isolate trading performance, read the P&L figures on the stat cards rather than the shape of the curve.

## P&L by pair

Broken down per pair, which surfaces two things a single total hides:

* **Concentration** — whether one pair is carrying the whole result.
* **Consistency** — whether the strategy works across pairs or only where it was tuned.

A total P&L that is positive because of a single outlier is a different situation from one that is positive across a dozen pairs, and the breakdown is where you see which you have.

## The positions table

Every position with its pair, side, size, entry, current or exit price, and P&L. Open positions carry unrealised P&L; closed ones carry realised.

## Verifying on-chain

Positions settle on-chain. The intended workflow is that you check them against a block explorer rather than trusting the table — the platform is built on the assumption that you will.

{% hint style="success" %}
Independent verification is the whole point of settling on-chain. If a number here disagrees with the chain, the chain is right and the [Help Desk](knowledge-and-help.md) wants to know.
{% endhint %}

## Risk Guard

The **Risk Guard** [add-on](../billing/add-ons.md) provides an automatic stop-out at a drawdown limit you set. It is the only add-on that changes execution behaviour rather than what you can see.

It is not a guarantee against loss: a stop-out executes at the price available when it triggers, which in a fast market is not the price at which it triggered.

## Related

* [Signal Engine](signal-engine.md) — where positions originate
* [Treasury](treasury.md) — the balance side of the account
