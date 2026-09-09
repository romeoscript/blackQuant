---
description: An honest read on who gets value from this and who does not.
---

# Who it is for

## It fits you if

**You want measured claims rather than screenshots.** Every rate on the platform carries a credible interval and an unmeasured rate stays `null`. If that discipline is why you are here, the rest of the product will make sense to you.

**You want to keep your keys.** The [custody model](../security/custody-model.md) is the reason this platform exists in the shape it does. If you are comparing it to a custodial exchange, that is the axis to compare on.

**You are comfortable verifying on-chain.** Positions settle where you can check them independently. The platform is designed on the assumption that you will, and it publishes the contracts so you can.

**You can read a confidence interval.** The numbers are honest, which means they are sometimes wide and sometimes absent. A platform that always shows a tidy number is hiding something; this one shows the untidiness.

## It does not fit you if

**You want someone to trade for you.** Nobody at BlackQuant exercises discretion over your capital. The engine publishes; you act. If you want a managed product, this is not one.

**You want guaranteed returns.** There are none, and any figure on the marketing site describing past volume or yield is a description of the past, not a forecast.

**You want custody handled for you.** Losing your keys means losing access, and there is no support path that recovers them — that is the direct cost of the guarantee that nobody else can move your funds either.

**You need the platform in a jurisdiction it does not serve.** Identity verification is required before withdrawal, and approval is jurisdiction-dependent.

## Experience level

| | What you need |
| --- | --- |
| **Wallet operation** | You can send an asset on a specific network without help, and you understand that a TRC-20 address is not an ERC-20 address |
| **Statistics** | You can read `75% [45, 93]` and understand why it is weaker than `75% [72, 78]` |
| **On-chain verification** | Helpful, not required. [Positions](../platform/positions.md) links each settlement to a block explorer |
| **Development** | Not required. The [Developers](../developers/architecture.md) section is optional |

## Before you commit money

1. Read [The custody model](../security/custody-model.md) so the guarantees and their costs are both clear.
2. Read [Reading the numbers honestly](../platform/signal-engine.md#reading-the-numbers-honestly).
3. Read the scope sections of the [published audits](../security/audit-reports.md) rather than the headline that a firm audited something.
4. Deposit an amount you would be unbothered to lose, and run the full loop once — deposit, plan, signal, withdrawal — before scaling up.

{% hint style="warning" %}
Step 4 is not a formality. The withdrawal path has an identity verification requirement that is easier to discover with $50 in the account than with $50,000.
{% endhint %}
