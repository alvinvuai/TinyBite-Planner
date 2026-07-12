# TinyBite Planner

TinyBite Planner is a mobile-first toddler meal planning app for parents who need practical, portion-specific ideas using foods already available at home. It is built with Next.js App Router, TypeScript, Tailwind CSS, Zod, and the OpenAI Node SDK.

## Features

- Cute pastel pink iPhone-first interface with animated CSS/SVG baby mascot.
- Single-meal and whole-day meal planning.
- Ingredient chips, free text input, and optional voice-to-text.
- Server-side OpenAI calls only.
- Strict JSON AI output validation with one repair attempt.
- Non-AI fallback meals when OpenAI is unavailable or the budget is reached.
- Local JSON usage tracking for development and pluggable storage interface for production.
- Monthly budget guard with 80%, 95%, and 100% notification hooks.

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create `.env.local` from `.env.example`:

```bash
OPENAI_API_KEY=your_key
OPENAI_MEAL_MODEL=gpt-5.6-luna
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
OPENAI_INPUT_PRICE_PER_1M=
OPENAI_OUTPUT_PRICE_PER_1M=
MONTHLY_BUDGET_USD=10
ADMIN_SECRET=choose_a_secret
NOTIFY_EMAIL=
RESEND_API_KEY=
DATABASE_URL=
```

Set `OPENAI_INPUT_PRICE_PER_1M` and `OPENAI_OUTPUT_PRICE_PER_1M` from the current model pricing page instead of hardcoding pricing into the app.

## Meal Record Storage

Meal records use Neon Postgres automatically when `DATABASE_URL` is configured. Without `DATABASE_URL`, local development falls back to `data/meal-records.json`.

To migrate local JSON records into Neon after setting `DATABASE_URL` in `.env.local`:

```bash
npm run import:meal-records
```

## Usage Endpoint

`GET /api/usage` requires `ADMIN_SECRET`.

```bash
curl -H "x-admin-secret: $ADMIN_SECRET" http://localhost:3000/api/usage
```

## Vercel Deployment

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Add environment variables from `.env.example`.
4. Deploy.

For v1, meal records can use Neon Postgres via `DATABASE_URL`. Usage/budget storage is still a local JSON file during development and in-memory on Vercel. For durable production cost controls, replace the `UsageStore` implementation in `lib/usageStore.ts` with Upstash Redis, Vercel KV, Supabase, or Postgres.

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial TinyBite Planner app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Scripts

- `npm run dev` starts local development.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs Next linting.
- `npm run import:meal-records` imports local saved meals into Neon.

## Feeding Safety Scope

TinyBite Planner gives practical meal ideas, not medical advice. It does not diagnose or promise weight gain. If poor weight gain continues, parents should review the situation with a GP, paediatrician, or dietitian.
