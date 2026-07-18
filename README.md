# Skilltego

India's Skill Discovery Platform — every person has a skill, every skill deserves an opportunity.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, React Hook Form + Zod, TanStack Query, Zustand
- **Backend**: Next.js Server Actions & Route Handlers
- **Database & Auth**: Supabase (PostgreSQL, Auth, Row Level Security, Realtime)
- **Media**: Cloudinary (avatar/cover/post/resume uploads, unsigned client-side upload)
- **Analytics**: PostHog (optional — no-ops if unconfigured)
- **AI**: Ollama + Qwen3 4B, running locally on your machine (free, no API key)
- **Hosting**: Vercel (free tier)
- **Testing**: Vitest (unit), Playwright (e2e), ESLint, Prettier

## Monorepo layout

```
apps/
  web/                 Next.js application
packages/
  types/               Supabase-mirrored Database types + domain types
  utils/                cn(), formatting, username validation
  config/              Site config, nav, skill categories
  database/            Supabase client factories + repositories + SQL migrations
  auth/                 Zod schemas + auth actions (sign up, sign in, OAuth, OTP, password reset)
  ui/                    Shared UI primitives (Button, Input, Card, Avatar, …) + design tokens
  moderation/           Rule-based profanity/spam/contact-info filters
e2e/                   Playwright end-to-end tests
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project (free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in `packages/database/migrations/` **in order** (0001 → 0005). Each is idempotent-per-run SQL that builds on the previous one — schema, RLS policies, triggers, and search indexes for every phase (profiles, posts, messaging, opportunities/dashboards, admin).
3. Under **Authentication → Providers**, enable Email and configure Google / GitHub OAuth if desired.
4. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your production URL) as a redirect URL.
5. To try the company/college/mentor dashboards or the admin panel, manually set a test user's `account_type` (and `admin`'s specifically for `/admin`) in the `profiles` table via the Supabase table editor — there's no self-serve way to become an admin, by design.

### 3. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from your Supabase project's **Settings → API** page).

Optional (features degrade gracefully without them):

- **Cloudinary** — avatar/cover/post media/resume uploads. Create an unsigned upload preset.
- **PostHog** — product analytics. Leave blank to disable tracking.
- **Ollama** — AI caption/bio/tag suggestions. Install [ollama.com](https://ollama.com), run `ollama pull qwen3:4b`, and it works out of the box against `http://localhost:11434`. These calls happen **client-side, from the visitor's browser** — Ollama runs on each user's own machine, not on the server, so a deployed instance needs `OLLAMA_ORIGINS=https://your-domain` set locally to accept the request.

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` / `format:check` — Prettier
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright end-to-end tests (starts its own dev server)

CI (`.github/workflows/ci.yml`) runs lint, type-check, format-check, unit tests, and a production build on every push/PR, plus a separate Playwright job.

## Deployment (Vercel)

1. Import the repo into Vercel — it auto-detects Next.js in `apps/web` (set **Root Directory** to `apps/web` in Project Settings, since this is a monorepo).
2. Add the environment variables from step 3 above in Vercel's Project Settings → Environment Variables.
3. Update your Supabase project's Auth redirect URLs and `NEXT_PUBLIC_SITE_URL` to the deployed domain.

## What's built, by phase

- **Phase 1**: Auth (email, OTP, Google, GitHub, password reset), database schema + RLS, landing + marketing pages, profiles (view/edit, skills, follow).
- **Phase 2**: Feed (following/latest/trending, infinite scroll), posts (text/image/carousel/video/pdf/code/GitHub/project links), likes, comments, search.
- **Phase 3**: Realtime messaging, notifications, rule-based content moderation, reports + moderator queue.
- **Phase 4**: Company/college/mentor dashboards, job/internship/competition/event/scholarship postings + applications, talent search, candidate bookmarks, mentor session booking + reviews, org verification requests.
- **Phase 5**: Admin panel (stats, users, posts, verifications), PostHog analytics, Ollama-backed AI suggestions (caption/bio/tags), sitemap/robots, CI, unit + e2e tests.

**Deliberately out of scope** for this free-tier build: payment/revenue features, a full CMS/feature-flag system, and AI-based NSFW/abuse detection (the moderation package is rule-based; swapping in an Ollama vision/text classifier is a natural extension of `packages/moderation`).
