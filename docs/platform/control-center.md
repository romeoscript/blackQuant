---
description: The dashboard home — balance, activity and account status at a glance.
---

# Control Center

The screen you land on after signing in. **Main → Control Center**, or `/dashboard`.

## What is on it

| Block | Shows |
| --- | --- |
| Balance | Current USD balance, derived from your ledger |
| Activity chart | Net movement per day over the selected window |
| Account status | Verification and 2FA state, with links to fix either |
| Notifications | Recent items from the bell menu |

## The activity chart

One bar per **calendar day**, in UTC. Credits are positive, spend is negative, and each bar is the *net* movement for that day.

| Window | Days |
| --- | --- |
| 7 days | 7 (default) |
| 30 days | 30 |
| 90 days | 90 |

{% hint style="info" %}
The tabs are labelled in days rather than "Weekly / Monthly / All time" on purpose. The chart draws a fixed window, and a tab claiming "all time" while showing a truncated one is exactly the kind of small lie this screen exists to avoid.
{% endhint %}

A day with no movement is a zero bar, not a gap — so the spacing between bars is real elapsed time rather than a compressed list of active days.

## Account status

Two states are surfaced here because both gate something you will want later:

* **Verification** — required before withdrawal. Links to [Verify your identity](../getting-started/verify-your-identity.md).
* **2FA** — links to [Secure your account](../getting-started/secure-your-account.md).

The sidebar carries the same status as a small badge beside each entry, so you can see at a glance what is outstanding without opening the page.

## Notifications

Three kinds, shown in the bell menu in the top bar:

| Kind | Used for |
| --- | --- |
| `WELCOME` | Account creation |
| `SECURITY` | 2FA changes, password changes, sign-in events |
| `SYSTEM` | Deposits, purchases, platform notices |

Mark one read by opening it, or clear the lot with **Mark all read**.

### Choosing what you are notified about

**Personal → My Profile** carries four independent switches:

| Preference | Default |
| --- | --- |
| Signals | On |
| Positions | On |
| Withdrawals | On |
| Referrals | Off |

Referrals default off because a busy referrer would otherwise be notified on every downstream purchase.

## Navigating from here

The sidebar groups everything into four sections:

```
Main       Control Center
Apps       Treasury · Fund Account · Signal Plan · Positions
           Withdrawals · Referral Hub · Signal Engine · Knowledge Base
Personal   My Profile · 2FA / Auth Guard · Reset Credentials · Verification
Others     Help Desk · Sign Out
```

**Signal Engine** carries a live badge when the engine is connected. If the deployment has no engine configured, the screen says so rather than showing invented numbers — see [Signal Engine](signal-engine.md).
