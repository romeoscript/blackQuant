---
description: Forgotten password, lost 2FA device, and what cannot be recovered.
---

# Account recovery

## Forgotten password

1. **Forgot password?** on the sign-in screen.
2. Enter your email.
3. Follow the emailed link.

{% hint style="info" %}
The response is the same whether or not an account exists for that address. That prevents the form being used to discover which addresses are registered — so "I got the same message" is not evidence either way about whether your account exists.
{% endhint %}

Reset tokens are stored **hashed**, are single-use, and expire. A token that has been used cannot be replayed.

## Changing your password while signed in

**Personal → Reset Credentials.**

This flow sends a code to your email and requires it before the change is accepted. Attempts against that code are counted, so it cannot be brute-forced.

This is also the route to **add a password to an account created through GitHub**, which starts with none.

## Lost 2FA device

Use a **recovery code** in place of the six-digit code. Each works once.

Once you are back in:

1. Go to **2FA / Auth Guard**.
2. Disable 2FA, or re-enrol on your new device.
3. **Regenerate your recovery codes** — you have spent at least one, and you should not run low without knowing.

## Out of recovery codes and no device

At this point the account cannot be recovered by self-service. Contact the [Help Desk](../platform/knowledge-and-help.md). Expect identity verification to be part of that conversation.

{% hint style="warning" %}
This is why the recovery codes are worth storing properly at enrolment. Ten codes, stored somewhere reachable without your phone, is the difference between a two-minute recovery and a support case.
{% endhint %}

## What cannot be recovered, by anyone

{% hint style="danger" %}
**Your wallet keys.** BlackQuant never held them and cannot restore them. There is no support path, no administrative override, and no exception.

This is the direct cost of the guarantee that nobody at BlackQuant can move your funds either. See [The custody model](custody-model.md).
{% endhint %}

**Funds sent over the wrong network.** Unrecoverable, by anyone, including the receiving chain's operators.

**A crypto transfer sent without a required memo or extra id.** Sometimes recoverable, often not. Contact support with the transaction hash immediately rather than sending again.

## Recovery matrix

| Lost | Recoverable? | How |
| --- | --- | --- |
| Password | Yes | Emailed reset link |
| 2FA device, have recovery codes | Yes | Use a recovery code |
| 2FA device, no recovery codes | Via support | Identity verification required |
| Email account itself | Via support | Identity verification required |
| Wallet private key | **No** | — |
| Funds sent on the wrong network | **No** | — |

## Reducing the odds you need this page

* [x] Recovery codes stored offline, separate from your password manager
* [x] Email account itself protected with 2FA
* [x] A password unique to this platform
* [x] Recovery codes regenerated when you have used several

## Related

* [Two-factor authentication](two-factor-authentication.md)
* [Troubleshooting](../resources/troubleshooting.md)
