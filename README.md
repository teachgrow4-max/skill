# Skilltego

India's Skill Discovery Platform — every person has a skill, every skill deserves an opportunity.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, React Hook Form + Zod, TanStack Query, Zustand
- **Backend**: Next.js Server Actions & Route Handlers
- **Database & Auth**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Media**: Cloudinary (avatar/cover uploads — wired up in a later phase)
- **Hosting**: Vercel (free tier)

## Monorepo layout

```
apps/
  web/                Next.js application
packages/
  types/               Supabase-mirrored Database types + domain types
  utils/                cn(), formatting, username validation
  config/              Site config, nav, skill categories
  database/            Supabase client factories + repositories + SQL migrations
  auth/                 Zod schemas + auth actions (sign up, sign in, OAuth, OTP, password reset)
  ui/                    Shared UI primitives (Button, Input, Card, Avatar, …) + design tokens
  api/, ai/             Reserved for later phases
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project (free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`packages/database/migrations/0001_init.sql`](packages/database/migrations/0001_init.sql). This creates the `profiles`, `profile_skills`, `profile_education`, `profile_experience`, and `follows` tables, an auto-profile-creation trigger, and Row Level Security policies.
3. Under **Authentication → Providers**, enable Email and configure Google / GitHub OAuth if desired.
4. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your production URL) as a redirect URL.

### 3. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project's **Settings → API** page.

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Phase 1 status

Authentication (email, OTP, Google, GitHub, password reset), database schema + RLS, landing page, and user profiles (view/edit, skills, follow) are implemented. Feed, messaging, AI moderation, dashboards, and the admin panel are planned for later phases.
