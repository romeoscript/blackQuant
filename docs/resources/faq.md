---
description: The questions that come up most, answered directly.
---

# FAQ

## Account

<details>
<summary>Do I need to verify my identity to use the platform?</summary>

Only to withdraw. Deposits, purchases, signals and positions all work without it. Verification is worth doing early anyway — see [Verify your identity](../getting-started/verify-your-identity.md).

</details>

<details>
<summary>I signed up with GitHub. Why won't my password work?</summary>

An account created through GitHub has no password. Sign-in fails identically to a wrong password rather than telling you the account exists — deliberately, so the form cannot be used to discover which addresses are registered. Add a password via **Personal → Reset Credentials**.

</details>

<details>
<summary>Can I change who referred me?</summary>

No. The link is recorded at sign-up and is permanent.

</details>

<details>
<summary>Can I delete my account?</summary>

Yes — **My Profile → Delete account**. It cascades to your submissions and documents. Export your data first if you want a copy.

</details>

## Money

<details>
<summary>Is my account balance the same as my trading capital?</summary>

No, and the distinction matters. The account balance is a USD credit for buying plans and add-ons, and it **is** custodial. Your trading capital stays under your own key. See [The custody model](../security/custody-model.md#where-the-account-balance-fits).

</details>

<details>
<summary>I sent an asset on the wrong network. Can it be recovered?</summary>

No. Not by BlackQuant, not by the processor, not by the chain. This is why the deposit page fixes the network per asset rather than offering a picker.

</details>

<details>
<summary>My deposit confirmed on-chain but my balance hasn't changed.</summary>

Crediting follows the signed callback, which can lag final confirmation slightly. If it persists, see [Troubleshooting](troubleshooting.md#deposit-states).

</details>

<details>
<summary>Why is there a minimum deposit?</summary>

Below it, network fees make the transfer uneconomic to credit.

</details>

## Plans

<details>
<summary>Do plans renew automatically?</summary>

No. A plan is a single fixed term — 30 or 365 days. Nothing recurs, because there is no stored payment method to charge. When it lapses you buy again.

</details>

<details>
<summary>Can I upgrade mid-term?</summary>

You can buy a different tier. You cannot buy the tier you currently hold — that is refused rather than silently overwriting your term.

</details>

<details>
<summary>What happens when my plan expires?</summary>

The entitlement stops. Balance, deposits, referral earnings and verification are unaffected. Entitlements are checked per request, so expiry takes effect immediately rather than at your next sign-in.

</details>

<details>
<summary>Is annual actually cheaper?</summary>

Yes — about 20% across every tier. Starter saves $72/year, Growth $192, Elite $480. See [Plans and pricing](../billing/plans-and-pricing.md).

</details>

## Signals

<details>
<summary>Why does a strategy show no win rate?</summary>

Nothing has resolved yet. Unmeasured rates are published as `null`, never as 0% — "not measured" and "measured at zero" are different claims and only one is an indictment.

</details>

<details>
<summary>What does `75% [45, 93]` mean?</summary>

The measured rate is 75%, and the true rate lies between 45% and 93% with 90% probability. A wide interval means very few resolved samples. Compare it with `75% [72, 78]` — same headline, vastly different evidence. See [Reading the numbers honestly](../platform/signal-engine.md#reading-the-numbers-honestly).

</details>

<details>
<summary>Does the signal engine trade for me?</summary>

No. It cannot. No API it exposes can place an order — the separation is structural. It measures and publishes; you act.

</details>

<details>
<summary>What is a "declared" rate?</summary>

A claim a strategy makes about itself, never a result. It is labelled as a claim and is never promoted into a measurement no matter how long it sits there.

</details>

## Security

<details>
<summary>Can BlackQuant move my funds?</summary>

Not your trading capital — the contracts are granted execution permission and never withdrawal permission. Your **account balance** is a different matter: that is a platform balance and is custodial.

</details>

<details>
<summary>I've lost my 2FA device and my recovery codes.</summary>

Contact the [Help Desk](../platform/knowledge-and-help.md). Identity verification will be part of that conversation.

</details>

<details>
<summary>Does support ever ask for my password or codes?</summary>

Never. Anyone who does is not support.

</details>

## Still stuck?

[Troubleshooting](troubleshooting.md) covers specific failures with specific fixes.
