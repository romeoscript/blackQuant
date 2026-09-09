---
description: A–Z of terms used across the platform and this documentation.
---

# Glossary

**Account balance** — A USD figure held against your account, derived from your ledger and used to buy plans and add-ons. Custodial, unlike your trading capital. See [The custody model](../security/custody-model.md#where-the-account-balance-fits).

**Add-on** — A permanent entitlement bought once, with no expiry. See [Add-ons](../billing/add-ons.md).

**Basis point (bps)** — One hundredth of a percent. 500 bps = 5%. Rates are stored this way so percentages of prices stay exact.

**Calibrated rate** — What a strategy's claim has historically been worth, measured against resolved outcomes. Leads over the raw score throughout the platform.

**Confirmation threshold** — How many block confirmations an asset needs before a deposit is credited. Ranges from 1 (XRP Ledger) to 32 (Solana).

**Credible interval** — The range containing the true rate with 90% probability. Written `[low, high]`. The most important number on any statistics screen.

**Declared rate** — A claim a strategy makes about itself. Never a result, and never promoted into a measurement.

**Deposit address** — An address provisioned for one asset on one **fixed** network, tied to your account.

**Deposit state** — `WAITING`, `CONFIRMING`, `CONFIRMED`, `PARTIALLY_PAID`, `FAILED` or `EXPIRED`. Transitions are forward-only.

**Entitlement** — Something your account is currently allowed to do. Granted by a plan for a term, or by an add-on permanently. Evaluated per request.

**Extra id** — A memo or destination tag required by some assets. Without it, a transfer cannot be attributed to your account.

**IPN** — Instant Payment Notification. The signed callback from the payment processor. The only path by which a balance increases. See [Webhooks](../developers/webhooks.md).

**KYC** — Know Your Customer. Identity verification, required before withdrawal.

**Ledger entry** — One immutable row recording a movement: amount, `kind`, and a reference to its cause. Balances are the sum of these.

**Liveness capture** — A selfie taken during verification, checking the submitter is the person in the document.

**MEV** — Maximal Extractable Value. Value capturable by ordering, including or excluding transactions within a block.

**Non-custodial** — BlackQuant is granted permission to execute specific routes and never permission to withdraw. A contract-level distinction, not a policy one.

**Payment intent** — A checkout tied to a specific purchase rather than to your balance generally. Fulfilled once, at settlement.

**Position** — An open or closed trade. Concurrent limits are set by your plan tier.

**Profit factor** — Gross wins divided by gross losses. Published as `null` rather than infinity when there are no losses yet.

**Recovery code** — A single-use code standing in for your authenticator app. Ten are issued at 2FA enrolment.

**Referral code** — Eight characters from an alphabet excluding `0`, `o`, `1`, `l` and `i`, because those get misread off a screen.

**Referral tier** — How far a commission travels up the chain. Tier 1 (direct) pays 5%; Tier 2 pays 2%.

**Reliability bin** — Strategy results grouped by claimed confidence, each with its own measured rate. Answers whether a strategy is right more often when it says it is confident.

**Signal** — A published observation that a measurable inefficiency exists. Not an order.

**Signal plan** — A subscription granting feed access at a tier, for 30 or 365 days.

**SSE** — Server-Sent Events. How deposit states and live signals reach the browser without polling.

**TOTP** — Time-based One-Time Password. The rotating six-digit codes used for 2FA.

**Win rate** — Proportion of resolved outcomes that were wins. `null` until something resolves — never defaulted to zero.
