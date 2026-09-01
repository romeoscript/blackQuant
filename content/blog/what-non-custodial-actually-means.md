---
title: What "Non-Custodial" Actually Means
excerpt: The word gets used by platforms that can still move your funds. Here is the specific technical question to ask, and how to verify the answer yourself on-chain.
category: Security
author: engineering
date: 2026-07-11
tags: [Custody, Smart Contracts, Security]
---

"Non-custodial" has become a marketing word. Plenty of platforms use it while
holding a key that can move your balance. The claim is only meaningful if you
can state precisely **which key signs what**, and verify it without trusting
the person telling you.

## The only question that matters

Not "do they hold my funds?" — that is answerable with a press release. The
question is:

> If this company disappeared tonight, could I still move my assets, and could
> anyone else move them without me?

Everything else is detail. A platform is non-custodial when the answer is *yes*
and *no* respectively, and it can be checked on-chain rather than asserted.

## Three arrangements that all get called non-custodial

**Actual custody, described otherwise.** The platform holds the private key.
Your "balance" is a number in their database. You withdraw by asking them. This
is a bank, and there is nothing wrong with a bank — but it is not
non-custodial, and the failure mode is the platform, not the market.

**Delegated execution.** You keep the key. You grant a contract permission to
perform specific actions — swap through this router, up to this size. The
platform can trade on your behalf and cannot withdraw to its own address,
because the approval does not permit it.

**Full self-custody.** You keep the key and sign every action yourself. Maximum
control, and unworkable for anything latency-sensitive: you cannot hand-sign a
transaction inside a 5 ms window.

The middle one is where systematic on-chain execution has to live. Which makes
the interesting question narrower: *what exactly did the approval permit?*

## Reading an approval

When you approve a contract, you are writing a permission to the chain. It has a
spender, an asset and an amount:

```solidity
// The pattern to be wary of: unlimited, forever.
IERC20(token).approve(spender, type(uint256).max);

// The pattern to prefer: scoped to the job in front of it.
IERC20(token).approve(spender, amountForThisRoute);
```

An unlimited approval is not automatically malicious — it saves gas on every
subsequent trade, which is why it is so common. But it means the permission
outlives the trade that motivated it. If that contract is ever compromised, the
approval is still sitting there.

Two habits worth having:

- **Audit your approvals periodically** and revoke ones you no longer use. Any
  block explorer will list them for your address.
- **Check what the spender can do.** An approval to a router that only swaps is
  a different risk from an approval to an upgradeable contract whose logic can
  be replaced later.

## Upgradeability is the quiet one

A contract that has been audited can still change. If it sits behind a proxy
with an admin key, today's audited logic can become tomorrow's something else,
and your approval carries over.

This is not inherently wrong — upgradeability is how bugs get fixed. But it
relocates the trust. You are no longer trusting reviewed code; you are trusting
whoever holds the admin key not to replace it, and to keep that key safe. So ask
who holds it, whether it is a multisig, and whether changes pass through a
timelock that gives you a window to exit.

## Verifying it yourself

You do not have to take anyone's word for any of this:

1. **Find the contract address** and open it in a block explorer.
2. **Check the source is verified** — that the deployed bytecode matches the
   published code. Unverified source means the audit you were shown describes
   something you cannot confirm is running.
3. **Look for an admin or owner**, and what powers it has.
4. **Read your own approvals** for that spender, and their amounts.
5. **Confirm withdrawals route to your address**, not to a platform wallet, by
   reading a past withdrawal transaction.

That is a fifteen-minute exercise and it settles the question properly.

## Why it is worth the fifteen minutes

Most large losses in this space were not clever cryptographic breaks. They were
permission problems: an approval that was broader than the task, an admin key
held by one person, a proxy that got upgraded. Those are all visible in advance
to anyone who looks.

Non-custodial is not a badge. It is a property you can check.
