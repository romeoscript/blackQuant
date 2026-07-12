# BlackQuant

Quantitative trading platform — built on a modern, fully-wired Next.js foundation.

## Stack

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------ |
| Framework          | Next.js 16 (App Router, Turbopack, React 19)                 |
| Styling            | Tailwind CSS v4 (CSS-first config, design tokens)            |
| Components         | shadcn/ui (Radix base, Lucide icons)                         |
| Global state       | Zustand (user store synced from the session)                 |
| Server state       | TanStack Query                                               |
| Auth               | Auth.js (NextAuth v5) + Prisma adapter (GitHub OAuth)        |
| Database / ORM     | PostgreSQL + Prisma                                          |
| Animation / scroll | GSAP (+ ScrollTrigger) and Lenis, integrated via GSAP ticker |
| Theming            | next-themes (light / dark / system)                          |
| Env safety         | Zod-validated env (`lib/env.ts`)                             |

## Architecture

```
app/            # App Router routes, server actions, root layout
components/
  ui/           # shadcn/ui primitives
  ...           # app components (mode-toggle, etc.)
providers/      # Client provider tree (session, query, theme, smooth scroll)
store/          # Zustand stores (global client state)
hooks/          # Reusable hooks (useUser, ...)
lib/            # env, prisma singleton, gsap setup, utils (cn)
types/          # Shared types + next-auth module augmentation
prisma/         # schema + seed
proxy.ts        # Next 16 proxy (auth middleware) with asset matcher
```

### Global user state

The NextAuth session is resolved on the server in `app/layout.tsx` and passed
into `<Providers>`. `SessionStoreSync` mirrors it into a Zustand store, so any
client component reads the current user without prop drilling or its own
`useSession()` call:

```tsx
"use client";
import { useUser } from "@/hooks/use-user";

export function Greeting() {
  const { user, isAuthenticated, isLoading } = useUser();
  if (isLoading) return null;
  return <span>{isAuthenticated ? user!.name : "Guest"}</span>;
}
```

### Animation

Import GSAP from `@/lib/gsap` (plugins are registered there) rather than from
`gsap` directly. Lenis smooth scroll is active app-wide and driven by GSAP's
ticker, so `ScrollTrigger` stays in sync automatically.

## Getting started

1. Copy env and fill it in:

   ```bash
   cp .env.example .env
   npx auth secret            # generates AUTH_SECRET
   ```

   Set `DATABASE_URL` and (for GitHub login) `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.
   Create a GitHub OAuth app with callback `http://localhost:3000/api/auth/callback/github`.

2. Install and set up the database:

   ```bash
   npm install
   npm run db:push          # or: npm run db:migrate
   npm run seed             # optional sample data
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Script                | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Dev server (Turbopack)             |
| `npm run build`       | Production build                   |
| `npm run start`       | Serve the production build         |
| `npm run typecheck`   | `tsc --noEmit`                     |
| `npm run lint`        | ESLint                             |
| `npm run format`      | Prettier                           |
| `npm run db:push`     | Push Prisma schema to the database |
| `npm run db:migrate`  | Create/apply a migration           |
| `npm run db:studio`   | Prisma Studio                      |
| `npm run seed`        | Seed sample data                   |

## Adding UI components

```bash
npx shadcn@latest add <component>
```
