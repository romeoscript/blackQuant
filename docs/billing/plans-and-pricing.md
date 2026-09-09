---
description: Every subscription tier, what it costs, and how terms behave.
---

# Plans and pricing

All prices in USD. Charged once per term from your account balance or via crypto checkout.

## Subscription tiers

### Starter

*For individuals getting started with automated signals.*

| Period | Price | Term | Item id |
| --- | --- | --- | --- |
| Monthly | $29 | 30 days | `plan-starter-monthly` |
| Annual | $276 | 365 days | `plan-starter-annual` |

* Up to 10 signals/day
* 1 active position
* Email alerts
* Basic analytics

### Growth — *Most Popular*

*For active traders scaling their portfolio performance.*

| Period | Price | Term | Item id |
| --- | --- | --- | --- |
| Monthly | $79 | 30 days | `plan-growth-monthly` |
| Annual | $756 | 365 days | `plan-growth-annual` |

* Up to 50 signals/day
* 5 active positions
* SMS & email alerts
* Advanced analytics
* Referral rewards

### Elite — *Pro*

*For professionals and teams running high-frequency strategies.*

| Period | Price | Term | Item id |
| --- | --- | --- | --- |
| Monthly | $199 | 30 days | `plan-elite-monthly` |
| Annual | $1,908 | 365 days | `plan-elite-annual` |

* Unlimited signals
* Unlimited positions
* Priority alert routing
* Full analytics suite
* Dedicated account manager
* API access

## How pricing is enforced

Prices live in exactly one place on the server. A purchase request carries an **item id**; the server looks the amount up itself.

{% hint style="success" %}
A checkout that trusted an amount from the browser would let anyone name their own price. This one cannot, because the browser never sends an amount at all.
{% endhint %}

## Subscriptions versus add-ons

| | Subscription | Add-on |
| --- | --- | --- |
| Has a term | Yes — 30 or 365 days | No |
| Expires | Yes | Never |
| Renews automatically | No | N/A |
| Repurchasable while held | No | No |

The **absence** of an expiry is what makes an add-on permanent. See [Add-ons](add-ons.md).

## Duplicate purchase protection

Attempting to buy something you currently hold is refused:

* Active subscription → *"That subscription is already active."*
* Owned add-on → *"You already own that."*

The check and the debit happen inside one database transaction, so two clicks landing at the same moment cannot both succeed.

## Referral commission

Every purchase pays commission up the referral chain — **5% to Tier 1, 2% to Tier 2**, calculated on the purchase price. This is funded by the business, not deducted from what you pay. See [Referral Hub](../platform/referral-hub.md).

## Paying

* [Paying with crypto](paying-with-crypto.md) — the checkout path when your balance is short.
* [Fund your account](../getting-started/fund-your-account.md) — topping the balance up first.
