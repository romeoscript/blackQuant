---
description: Permanent extras sold beside the deposit flow, and the one that is not permanent.
---

# Add-ons

Add-ons are sold on the **store surface** beside the deposit flow, separately from [signal plans](plans-and-pricing.md). They are separate products at separate prices, and they share only the way they are paid for.

## Permanent add-ons

Bought once, owned forever. No expiry, no renewal.

| Add-on | Price | What it does | Item id |
| --- | --- | --- | --- |
| **VIP Analytics Pack** | $200 | Attribution and drawdown reporting | `vip-analytics` |
| **Priority Support** | $150 | Four-hour response, around the clock | `priority-support` |
| **Extra Positions Slot** | $100 | One more concurrent position | `extra-position-slot` |
| **Risk Guard Add-on** | $250 | Automatic stop-out at your drawdown limit | `risk-guard` |

{% hint style="info" %}
These have **no expiry timestamp**, and that absence is precisely what makes them permanent. There is no renewal to forget and no term to track.
{% endhint %}

## Signal Pro — a subscription on the store surface

The one exception. Signal Pro sits with the add-ons but behaves like a plan: it has a term and it lapses.

| Period | Price | Term | Item id |
| --- | --- | --- | --- |
| Monthly | $500 | 30 days | `signal-pro-monthly` |
| Annual | $4,800 | 365 days | `signal-pro-annual` |

*Automated signals, rebalanced daily.* The annual price is **two months free** against the monthly rate — $6,000 charged as $4,800.

## Which ones are worth it

Honestly, it depends on what you already have:

**Extra Positions Slot** only matters on Starter (1 position) or Growth (5). Elite is already unlimited, so buying it there does nothing.

**VIP Analytics Pack** overlaps with what Growth's "Advanced analytics" and Elite's "Full analytics suite" already include. It is aimed at Starter.

**Priority Support** is independent of tier, except that Elite already includes a dedicated account manager.

**Risk Guard** is independent of tier and is the only add-on that changes execution behaviour rather than what you can see.

{% hint style="warning" %}
Check your current tier's included features in [Plans and pricing](plans-and-pricing.md) before buying an add-on. Nothing stops you buying an add-on that duplicates something your plan already grants.
{% endhint %}

## Buying

Same mechanics as a plan:

1. Pay from your **account balance**, or start a **crypto checkout**.
2. The entitlement is granted on settlement.
3. Buying something you already own is refused with *"You already own that."*

Prices are looked up server-side from the item id — the browser never sends an amount.

## Commission

Add-on purchases pay referral commission up the chain exactly like plans do: 5% Tier 1, 2% Tier 2. See [Referral Hub](../platform/referral-hub.md).
