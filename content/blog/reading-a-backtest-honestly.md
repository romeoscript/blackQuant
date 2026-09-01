---
title: How to Read a Backtest Honestly
excerpt: Every strategy looks good on the data it was built from. These are the five questions that separate a result you can trade from a curve that was fitted to the past.
category: Research
author: research
date: 2026-07-29
tags: [Quant, Backtesting, Risk]
---

A backtest is not evidence. It is a hypothesis with good presentation. The
equity curve slopes up because someone chose the parameters that made it slope
up — that is what building a strategy *is*. The useful question is never "did it
work?" but "how hard did I have to try to make it work?"

Here are the five questions worth asking of any result, including your own.

## 1. How many parameters, and how many trades?

A strategy with eight tunable parameters fitted over 200 trades has roughly one
degree of freedom for every 25 observations. That is not a strategy; it is a
drawing.

The rough guard: you want **at least 30 trades per parameter** before the result
means much, and more if returns are fat-tailed. If a backtest shows a beautiful
Sharpe over 40 trades, the honest summary is "insufficient data", regardless of
what the number says.

## 2. Was the exit rule chosen after seeing the data?

This is the subtlest failure and the most common. You build an entry signal,
test it, and the result is mediocre. So you try a trailing stop. Then a
time-based exit. Then a wider stop for volatile regimes.

Each of those decisions used information from the test set. By the fourth
variation you are no longer testing a strategy — you are searching for one, and
your test set has quietly become your training set.

> The number of hypotheses you tried is part of your result. A Sharpe of 1.8
> found on the ninetieth attempt is not the same finding as a Sharpe of 1.8 on
> the first.

## 3. Does it survive costs it will actually pay?

Costs are where most paper edges die. The three that matter:

- **Spread.** You do not trade at mid. Assume you cross.
- **Slippage.** Your own order moves the price. This scales with size and
  inversely with depth, so a strategy that works at 10k may not at 500k.
- **Fees and gas.** On-chain, this is not a rounding error. A strategy averaging
  8 bps of edge does not survive 6 bps of cost.

A useful exercise: find the cost level at which the edge goes to zero. If the
answer is close to what you actually pay, the strategy is a cost-model bet, not
a market bet.

## 4. Is the performance concentrated?

Strip out the best five trades. Does the curve still slope up?

If a year of returns is carried by two positions, you have not found a
repeatable edge — you have found two good trades and a lot of noise around them.
That may still be worth trading, but it is a different risk profile from what
the headline Sharpe implies, and it will feel very different to hold.

## 5. What regime was it built in?

A strategy fitted entirely to 2021 learned that things go up. One fitted to 2022
learned that they go down. Neither learned much about markets.

Check the date range against what was happening in it. Then ask the harder
question: **what market condition would break this?** If you cannot name one,
you do not yet understand what the strategy is betting on — and you will find
out when it arrives.

## What a defensible result looks like

None of this means backtests are useless. It means the presentation should show
its work:

| Reported | Instead of |
| --- | --- |
| Out-of-sample window, held back from the start | One number over all data |
| Trade count and parameter count | Sharpe alone |
| Return net of modelled costs | Gross return |
| Worst drawdown and its duration | Best year |
| Performance excluding top decile of trades | Headline total |

A strategy that reports these and still looks ordinary is far more interesting
than one that reports a single number and looks spectacular. The first is
telling you what it is. The second is telling you what it wants you to think.
