---
description: >-
  The live feed, the measured statistics behind each strategy, and how to read
  them without fooling yourself.
---

# Signal Engine

**Apps → Signal Engine.** The live trade feed and the measured performance of every tracked strategy.

{% hint style="success" %}
**This API places no orders.** Nothing reachable from the signal engine can move money. It watches, measures and publishes — execution is a separate layer that you initiate. See [The custody model](../security/custody-model.md).
{% endhint %}

## When the engine is not connected

If a deployment has no signal engine configured, this screen **says it is not connected**. It does not fall back to sample data or a plausible-looking chart.

That is a deliberate choice: a screen that invents numbers when its data source is down is worse than a blank one, because you cannot tell the difference from the outside.

## The live feed

Signals stream over a server-sent event connection, so the feed updates without a refresh. Each signal carries:

| Field | What it is |
| --- | --- |
| Chain and DEX | Where the pair trades |
| Pair address | The contract, linkable to an explorer |
| Price / liquidity / FDV | Market context at the time of the signal |
| Buys / sells / buy ratio | Flow behind the observation |
| Age | How long the pair has existed |
| Origin | `tx`, `trade-id`, or `simulated` |

The **origin** matters. A signal derived from a real on-chain transaction and one produced by a simulation are both shown, and they are labelled differently.

## Reading the numbers honestly

This is the part worth slowing down for. The screen distinguishes three very different things that most platforms collapse into one number.

### Basis: what a rate actually rests on

| Basis | Meaning |
| --- | --- |
| `calibration` | The fullest record — every resolved outcome, including ones restored from previous runs and ones reported over the API |
| `stats` | This run only |
| `declared` | **A claim, never a result** |
| `none` | Nothing measured yet |

{% hint style="danger" %}
**A declared rate is never promoted into a measurement.** If a strategy asserts it wins 80% of the time, that assertion is displayed as a claim and stays labelled as one no matter how long it sits there. It never quietly becomes a measured figure.
{% endhint %}

The calibrated figure leads throughout. The raw score is what the engine *claimed*; the calibrated one is what that claim has *historically been worth*, and it is the one to act on.

### `null` is not zero

A win rate is published as `null` until something resolves. The platform never defaults that to 0%.

"Not measured yet" and "measured at 0%" are entirely different claims, and only one of them is an indictment of the strategy. Collapsing them would make every new strategy look like a failing one.

### Credible intervals

Every published rate carries a **90% credible interval** — the range containing the true rate with 90% probability, given what has been observed.

| Displayed | Resolved samples | What it tells you |
| --- | --- | --- |
| `75% [45, 93]` | ~4 | Almost nothing. The true rate could be a coin flip |
| `75% [72, 78]` | ~400 | A real measurement worth acting on |

Both are "75%". Only one is worth anything.

{% hint style="warning" %}
If you take one thing from this page: **read the interval, not the headline percentage.** A wide interval means the strategy has barely been measured, regardless of how good the midpoint looks.
{% endhint %}

### Reliability bins

Strategies are also broken into bins by claimed confidence, each with its own signal count, win count and measured rate. This answers a sharper question than an overall win rate: *when this strategy says it is confident, is it actually right more often?*

A well-calibrated strategy shows rising measured win rates across ascending bins. One that does not is confident at random.

## Simulated performance

Where equity curves are shown as simulated, the screen carries the **assumptions** that produced them:

| Assumption | Why it matters |
| --- | --- |
| Starting capital | Scales everything |
| Risk per trade | The single biggest driver of a drawdown figure |
| Fee basis points | Omitting fees flatters every result |
| Max leverage | Changes the shape of the tail |
| Sizing (`calibrated` or `fixed`) | Calibrated sizing uses the measured edge; fixed does not |

A simulated result without its assumptions attached is not interpretable, so they travel together.

## Strategy metrics

| Metric | Note |
| --- | --- |
| Total P&L % | Net of fees where fees are modelled |
| Gross win % / gross loss % | Separated, so profit factor is reconstructable |
| Profit factor | `null` when there are no losses yet — not infinity |
| Best / worst trade | Tail behaviour |
| Max drawdown % | Peak-to-trough |
| Longest loss streak | What you would actually have had to sit through |

{% hint style="info" %}
**Longest loss streak** is the number most people skip and most need. A strategy with an excellent win rate and an eleven-trade losing streak is one most people abandon at trade seven.
{% endhint %}

## Timeouts

Requests to the engine time out after **5 seconds**. Long enough for a busy engine, short enough that a dead one is a clear error rather than a hanging page.

## Access

The live feed requires an active [signal plan](../billing/plans-and-pricing.md). Daily signal limits by tier:

| Tier | Signals/day | Active positions |
| --- | --- | --- |
| Starter | 10 | 1 |
| Growth | 50 | 5 |
| Elite | Unlimited | Unlimited |

## Related

* [Positions](positions.md) — what happened after you acted
* [Key concepts](../introduction/key-concepts.md#credible-interval)
