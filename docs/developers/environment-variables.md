---
description: Every variable, whether it is required, and what breaks without it.
---

# Environment variables

Validated by Zod in `lib/env.ts` at boot. A failure throws a message naming the field rather than surfacing later as a confusing runtime error.

## Required

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Must be a valid URL |
| `AUTH_SECRET` | Signing secret. Generate with `npx auth secret` |

{% hint style="danger" %}
**`AUTH_SECRET` is more load-bearing than it looks.** It signs sessions **and** derives the encryption key for stored TOTP secrets via HKDF.

Rotating it invalidates every session **and** makes every stored 2FA secret undecryptable — enrolled users must fall back to a recovery code and re-enrol. Not a routine operation.

To rotate without dropping sessions, `@auth/core` accepts an array and tries each in order: `secret: [newSecret, previousSecret]` in `auth.config.ts`, newest first.
{% endhint %}

## Optional

Everything below is optional. Each degrades a specific feature rather than breaking the app.

### Authentication providers

| Variable | Without it |
| --- | --- |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub sign-in button is not rendered |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in button is not rendered |
| `AUTH_URL` | Falls back to localhost for links in outgoing mail |

Providers are added conditionally, so an unset id removes the button rather than producing a broken one.

### Email

| Variable | Without it |
| --- | --- |
| `RESEND_API_KEY` | Mail is logged instead of sent |
| `RESEND_FROM` | **Required** when the API key is set |

`RESEND_FROM` must be `email@example.com` or `Name <email@example.com>`. Checked at boot, because a malformed sender otherwise surfaces as a 422 the first time someone resets a password.

### Object storage

| Variable |
| --- |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |

Any S3-compatible service: AWS S3, Cloudflare R2, Backblaze B2, MinIO.

{% hint style="warning" %}
Without a bucket, KYC uploads fall back to a **development-only local directory**. Do not run production that way.
{% endhint %}

### Payments

| Variable |
| --- |
| `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `NOWPAYMENTS_BASE_URL` |

{% hint style="danger" %}
The API key without the IPN secret is **the dangerous half-configuration**: addresses get handed out and money arrives, but every callback that would credit it fails signature verification.

Boot fails if the key is set without the other two, so this cannot be discovered at deposit time.
{% endhint %}

### Signal engine

| Variable | Notes |
| --- | --- |
| `SIGNAL_ENGINE_BASE_URL` | Absolute URL, e.g. `http://127.0.0.1:8820`. Unset → the UI says "not connected" |
| `SIGNAL_ENGINE_API_KEY` | Only needed when the engine is bound off the loopback interface |

A relative or half-typed URL fails at `fetch` time and looks identical to the engine being down — one is a config typo and the other is an outage, so the URL is validated at boot.

### Assistant

| Variable | Notes |
| --- | --- |
| `ASSISTANT_API_KEY` | Any OpenAI-compatible provider |
| `ASSISTANT_BASE_URL`, `ASSISTANT_MODEL`, `ASSISTANT_EMBED_MODEL` | Provider and model selection |

### Status page

| Variable | Notes |
| --- | --- |
| `STATUS_PAGE_URL` | Must be `http` or `https` |

{% hint style="info" %}
Scheme is validated rather than just parsed. A `javascript:` URL parses perfectly well and would put a script sink in the footer of every page — only `http` and `https` pass.

The status page is hosted off this infrastructure on purpose: a status page served by the app it reports on says nothing during the outage that matters most.
{% endhint %}

### Media

| Variable |
| --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

## Cross-field rules

| Rule |
| --- |
| `RESEND_FROM` required when `RESEND_API_KEY` is set, and must match the sender format |
| `NOWPAYMENTS_IPN_SECRET` and `NOWPAYMENTS_BASE_URL` required when `NOWPAYMENTS_API_KEY` is set |
| `SIGNAL_ENGINE_BASE_URL` must be an absolute URL |
| `STATUS_PAGE_URL` must be `http` or `https` |

## Production checklist

* [ ] `AUTH_SECRET` generated fresh, not copied from development
* [ ] `DATABASE_URL` points at production with connection limits set
* [ ] S3 bucket configured — **not** the local fallback
* [ ] `NOWPAYMENTS_IPN_SECRET` set alongside the API key
* [ ] `RESEND_API_KEY` and a verified `RESEND_FROM`
* [ ] `AUTH_URL` set to the real origin
* [ ] `STATUS_PAGE_URL` pointing at a monitor hosted elsewhere
