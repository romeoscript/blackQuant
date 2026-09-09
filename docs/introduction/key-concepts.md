---
description: The vocabulary used throughout the platform and these docs.
---

# Key concepts

Terms are listed in the order you meet them, not alphabetically. For a flat A–Z, see the [Glossary](../resources/glossary.md).

## Account balance

A **USD figure held against your account**, used to buy plans and add-ons. It is derived from your ledger rather than stored as a standalone number, so every movement in it has a row explaining where it came from.

{% hint style="warning" %}
Your account balance is **not** your trading capital, and it is not a custodial holding of your crypto. Deposited crypto is converted to a USD credit at the time it confirms. See [The custody model](../security/custody-model.md).
{% endhint %}

## Ledger entry

One immutable row recording a movement: an amount in USD, a `kind` describing why, and a reference id pointing at whatever caused it. Deposits credit; purchases debit; commissions credit.

Deriving the balance from the ledger rather than incrementing a counter is what makes the number auditable — you can always ask *why* a balance is what it is.

## Deposit address

An address provisioned for **one asset on one fixed network**, tied to your account. It carries a minimum amount, below which the network fee makes the transfer uneconomic to credit.

Some assets additionally require an **extra id** (also called a memo or destination tag). Where one is shown, a transfer sent without it cannot be attributed to your account.

## Deposit state

| State | Meaning |
| --- | --- |
| `WAITING` | Address provisioned, nothing seen on-chain yet |
| `CONFIRMING` | Transaction seen, confirmations still accruing |
| `CONFIRMED` | Threshold reached, balance credited |
| `PARTIALLY_PAID` | Less than the expected amount arrived |
| `FAILED` | The transfer did not complete |
| `EXPIRED` | The address window closed before funds arrived |

Handling for each is in [Troubleshooting](../resources/troubleshooting.md#deposit-states).

## Signal

A published observation that a measurable inefficiency exists right now. A signal is **not an order**. The signal engine has no path to execution — see [Signal Engine](../platform/signal-engine.md).

## Credible interval

The range that contains the true rate with 90% probability, given what has been observed so far. Written as `[low, high]`.

This is the single most important number on the statistics screens. A strategy showing `75% [45, 93]` and one showing `75% [72, 78]` are not comparable claims: the first has barely been measured, the second has been measured a great deal.

{% hint style="info" %}
A rate published as `null` means **not yet measured**, not zero. The platform never defaults an unmeasured rate to 0%, because that would read as a failing strategy when it is actually an unmeasured one.
{% endhint %}

## Signal plan

A **subscription** granting access to the signal feed at a given tier, with a fixed term — 30 days monthly, 365 days annual. It lapses at expiry. Tiers and prices are in [Plans and pricing](../billing/plans-and-pricing.md).

## Add-on

A **permanent** entitlement bought once, with no expiry. That absence of an expiry is exactly what makes it permanent. Listed in [Add-ons](../billing/add-ons.md).

## Entitlement

The general term for "something your account is currently allowed to do". A plan grants one for a term; an add-on grants one forever. Entitlements are evaluated per request, against the expiry timestamp, rather than cached in your session.

## Referral tier

How far up the chain a commission travels from a purchase.

| Tier | Who | Rate |
| --- | --- | --- |
| Tier 1 | Your direct referrer | 5% (500 bps) |
| Tier 2 | Their referrer | 2% (200 bps) |

Rates are stored in **basis points** rather than as floats, because 5% of $29 has to be an exact decimal and `0.05 * 29` is not one.

## Referral code

An eight-character code from an alphabet with `0`, `o`, `1`, `l` and `i` removed — those get misread off a screen and become support tickets. Attribution is remembered in a cookie for **30 days**, so a visitor who reads the site and signs up a week later is still credited.

## KYC submission

An identity verification attempt: a document type, its images, and a status of `PENDING`, `APPROVED` or `REJECTED`. Documents accepted are passport (1 side), driver's licence (2 sides) and national ID card (2 sides). See [Verify your identity](../getting-started/verify-your-identity.md).

## Recovery code

A single-use code that stands in for your 2FA app. Spending one marks it used in the same statement that selects it, which is what stops the same code authenticating twice from two simultaneous attempts. See [Account recovery](../security/account-recovery.md).
