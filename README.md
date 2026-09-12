# DayReady

A calm, single dashboard to get ready for your day: tasks, a bookings calendar,
and a camera-based meal calorie tracker powered by Claude's vision model.

## Features

- **Tasks** — quick-add with natural language ("Call dentist tomorrow 3pm"),
  priorities, categories, and a satisfying complete/undo animation.
- **Calendar & bookings** — month/week/day views (FullCalendar), drag to
  reschedule, resize to adjust duration, and basic overlap detection.
- **Nutrition camera** — snap or upload a photo of a meal, Claude's vision
  model estimates the foods, portions, and calories/macros, and you can
  correct the estimate before saving.
- **Dashboard** — a "briefing" view combining today's tasks, schedule, and
  nutrition totals with an animated progress ring.
- **Auth** — email/password accounts with hashed passwords and JWT sessions.
- **Settings** — daily calorie/macro goals, theme, and a one-click JSON export
  of all your data.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Bootstrap 5 with a custom Sass theme (no default Bootstrap look)
- **Postgres** via Drizzle ORM + `postgres` (postgres-js) — pure JS driver, no
  native bindings, so it deploys cleanly on Vercel's serverless functions
- Auth.js (NextAuth v5) with the Credentials provider
- Claude (`@anthropic-ai/sdk`) for meal photo analysis
- FullCalendar, react-webcam, chrono-node, react-hot-toast

## Getting started

1. **Get a Postgres database.** The fastest free option is
   [Neon](https://neon.tech) — create a project, copy the connection string
   it gives you (use the "pooled connection" variant).
2. **Configure env vars:**
   ```bash
   cp .env.example .env
   # then fill in DATABASE_URL, NEXTAUTH_SECRET, and ANTHROPIC_API_KEY
   ```
3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:3000 and create an account. Tables are created
automatically on first request (idempotent `CREATE TABLE IF NOT EXISTS`
statements) — there's no separate migration step for getting started.

For schema changes down the line, or a more conventional migration
workflow, `drizzle.config.ts` is already set up:
```bash
npm run db:push     # push schema.ts changes straight to your database
npm run db:studio   # browse your data in Drizzle Studio
```

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Neon, Supabase, Vercel Postgres, or any Postgres host) |
| `NEXTAUTH_SECRET` | yes | any long random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | `http://localhost:3000` locally; your deployed URL in production |
| `ANTHROPIC_API_KEY` | yes, for the camera feature | pay-as-you-go, separate from any Claude.ai subscription — from [console.anthropic.com](https://console.anthropic.com) |

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Import it in Vercel ("Add New Project").
3. Set the four environment variables above in the Vercel project settings —
   for `DATABASE_URL`, use the same Neon/Supabase connection string (or spin
   up a separate production database) and make sure it's the **pooled**
   connection string, since serverless functions open many short-lived
   connections.
4. Set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`).
5. Deploy — Vercel builds with `next build` and redeploys on every push to `main`.

That's it — no native dependencies to compile, no separate database
provisioning step beyond the connection string, and no filesystem writes
(unlike a SQLite-based setup, which would lose data between serverless
invocations).

### A note on the auto-migration

`lib/db/index.ts` runs `CREATE TABLE IF NOT EXISTS` statements on first use
per server instance — this is what makes local setup and first deploy
"just work" with zero extra steps. It's cheap and idempotent, which is fine
for a project this size. If you outgrow it (a team, frequent schema changes,
needing rollback history), switch to `drizzle-kit generate` + versioned
migration files instead of relying on the inline DDL.

## Project structure

```
app/            Pages and API routes (App Router)
components/     UI components, grouped by feature
lib/            Auth config, DB client + schema, Claude vision helper, shared types
styles/         Custom Bootstrap Sass theme
proxy.ts        Route protection (Next.js 16's renamed middleware)
drizzle.config.ts   Config for drizzle-kit (db:push / db:studio)
```
