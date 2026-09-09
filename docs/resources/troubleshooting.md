---
description: Specific failures and the specific fix for each.
---

# Troubleshooting

## Deposit states

| State | Cause | What to do |
| --- | --- | --- |
| `WAITING` longer than expected | Wallet has not broadcast, or is queuing | Check your wallet's outgoing transaction |
| `CONFIRMING` | Normal — confirmations accruing | Wait. Thresholds range from 1 (XRP) to 32 (SOL) |
| `PARTIALLY_PAID` | Less arrived than expected | [Help Desk](../platform/knowledge-and-help.md) with the transaction hash |
| `FAILED` | Transfer did not complete | Check your wallet — funds usually never left |
| `EXPIRED` | Window closed before arrival | Request a **new** address. Do not reuse the old one |
| `CONFIRMED` but balance unchanged | Callback lag | Wait a few minutes, then contact support |

### Nothing appears at all

1. Confirm you sent on the **network shown on the deposit page**, not merely the right asset.
2. Confirm the amount was above the **minimum**.
3. Confirm any required **memo / extra id** was included.
4. Check the transaction hash on a block explorer.

{% hint style="danger" %}
If you sent over the wrong network, the funds are not recoverable. Nothing in the support process changes that.
{% endhint %}

## Sign-in

### "Something went wrong on our end"

Generic auth failure. In order of likelihood:

1. **Wrong password.**
2. **The account has no password** — it was created via GitHub. Use the GitHub button, or add a password through **Reset Credentials**.
3. **Wrong or expired 2FA code** — see below.
4. **A stale session cookie.** Clear cookies for the site and retry.

All of these fail identically on purpose, so the form cannot be used to enumerate accounts.

### 2FA codes always rejected

Almost always a device clock. Codes are accepted with **one step** of skew either side — about thirty seconds. Turn on automatic time synchronisation.

If the clock is right, use a recovery code, then disable and re-enrol.

### Signed out sooner than expected

"Remember me" unticked means a **24-hour** session, not "until I close the tab". Ticked is 30 days.

### Signed out unexpectedly, or stuck on the sign-in screen

A stale session cookie. One page load normally clears it by itself. If it persists, clear cookies for the site and sign in again.

## Purchases

| Message | Meaning |
| --- | --- |
| *"That subscription is already active."* | You hold it. Wait for the term, or buy a different tier |
| *"You already own that."* | Add-ons are permanent — there is nothing to re-buy |
| *"That item isn't available."* | Unknown item id |
| Insufficient balance | Top up, or use crypto checkout |

### Checkout did not grant anything

1. Confirm the payment reached the required confirmations.
2. Check the state on the deposit screen.
3. Contact support with the transaction hash. **Do not send again.**

## Verification

| Rejection | Fix |
| --- | --- |
| Corners not visible | Photograph the whole document flat, with margin |
| Glare | Diffuse light; avoid direct overhead light on laminate |
| Illegible text | Fill the frame; do not upscale a small crop |
| Expired document | Use a current one |
| Wrong number of sides | Passport 1; licence and ID card 2 |
| File too large | 8 MB max; JPEG, PNG or WebP |

A rejection is not final — fix the specific issue named in the note and resubmit.

## Signal engine

### "Not connected"

The engine is not currently reachable. This is a deliberate message rather than a fallback to sample data, so you can tell a missing engine from a working one.

Nothing to do at your end — the live feed returns when the engine does.

### The feed stalls

Requests time out after **5 seconds**. Reload; if it persists the engine is likely down. Check `/api/health` and read `checks.signalEngine.status`.

## Referrals

| Symptom | Explanation |
| --- | --- |
| Referral not credited | The cookie is 30 days — they may have signed up after it lapsed, or cleared cookies, or used a different browser |
| Referral shows but no commission | Commission is paid on **purchases**, never deposits |
| Commission smaller than expected | Tier 1 is 5%, Tier 2 is 2%, on the purchase price |

## Getting help

Include the transaction hash, the asset **and network**, the deposit state, and what you expected versus what happened. See [Knowledge Base & Help Desk](../platform/knowledge-and-help.md).
