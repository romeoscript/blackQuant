---
description: From a clone to a running dev server.
---

# Running it locally

## Prerequisites

* **Node.js** — a version supporting Next.js 16
* **PostgreSQL** — local or hosted
* **Docker** (optional) — only for the local MinIO bucket

## 1. Environment

```bash
cp .env.example .env
npx auth secret            # generates AUTH_SECRET
```

Then set `DATABASE_URL`. For GitHub sign-in, set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`, and create a GitHub OAuth app with the callback:

```
http://localhost:3000/api/auth/callback/github
```

Every variable is documented in [Environment variables](environment-variables.md).

## 2. Install and set up the database

```bash
npm install
npm run db:push          # or: npm run db:migrate
```

`npm install` runs `prisma generate` via `postinstall`, so the client is ready afterwards.

## 3. Run

```bash
npm run dev
```

The dev server starts on `http://localhost:3000`. `predev` runs `prisma generate` and copies the face-detection models, so a fresh clone works without extra steps.

## Optional: local object storage

Identity documents need an S3-compatible bucket. For local development:

```bash
npm run minio
```

Then point `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` at it.

{% hint style="danger" %}
Without a bucket configured, uploads fall back to a **local directory that is development-only**. Never run a production deployment that way — identity documents would sit on the application server's filesystem. The Verification screen reports which mode a deployment is in.
{% endhint %}

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run db:push` | Push schema without a migration |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:studio` | Prisma Studio |
| `npm run minio` | Local MinIO for document storage |
| `npm run ingest` | Build the knowledge base index |
| `npm run ipn` | Exercise the deposit webhook locally |

## Verifying it works

```bash
curl -s localhost:3000/api/health | jq
```

`status` is `ok`, `degraded` or `down`. A `down` result returns **503**; `degraded` stays **200**, because the site is still serving and marking everything red would state something untrue.

## Common setup problems

### `no matching decryption secret`

A session cookie in your browser was encrypted with a different `AUTH_SECRET`. The app already sends a header clearing the cookie, so one page load fixes it. If it persists, delete `authjs.session-token` for `localhost:3000` in DevTools.

### `Invalid environment variables`

`lib/env.ts` validates at boot and the error names the field. Related settings are checked together — for instance, `NOWPAYMENTS_API_KEY` without `NOWPAYMENTS_IPN_SECRET` fails, because that combination hands out deposit addresses while every crediting callback fails signature verification.

### Prisma client out of date after a schema change

```bash
npx prisma generate
```

## Related

* [Environment variables](environment-variables.md)
* [Architecture](architecture.md)
