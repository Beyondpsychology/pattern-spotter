# The Pattern Spotter

A free, email-gated AI reading tool. Visitors answer four questions, pick the
hypothesis that lands, and get back a 5-section reading plus product
recommendations — one full reading per email address.

- `/` — placeholder salespage (to be replaced later)
- `/tool` — the entire product: email gate → 4 questions → hypothesis
  selection → full reading. No login, no accounts.

This guide assumes you've never done this before. Follow it in order.

## 1. Install dependencies

```bash
npm install
```

## 2. Get your environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in each value in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → create a free project → **Project Settings → API** → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, "anon public" key. (Not currently used by any client-side code in this app, since there's no login — it's included so the project matches the standard Supabase env var setup, in case you add client-side reads later.) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, "service_role" key. **Keep this secret** — it bypasses all database security rules. It is only ever read inside API routes on the server, never sent to the browser. |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → **API Keys** → Create Key. This key is billed per API call — see the cost note at the bottom of this file. |

Never commit `.env.local` — it's already in `.gitignore`.

## 3. Run the database migration

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open `app/api/generate/route.ts` in this project and copy the SQL comment
   block at the very top of the file (starts with `CREATE TABLE IF NOT EXISTS
   email_captures`).
3. Paste it into the SQL Editor and click **Run**.

This creates one table, `email_captures`, which tracks which emails have
already used their free reading (`has_completed`) and stores the reading
itself as JSON for future reference.

## 4. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000/tool](http://localhost:3000/tool) — that's the
whole product. `http://localhost:3000/` is just the placeholder salespage.

## 5. Deploy to Vercel

1. Push this repo to GitHub (if it isn't already there).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import
   the repo.
3. In the import screen, expand **Environment Variables** and add all four
   from your `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ANTHROPIC_API_KEY`.
4. Click **Deploy**. Vercel will build and give you a live URL.
5. Every subsequent `git push` to your main branch redeploys automatically.

## Cost note

`/api/generate` is the only route that costs money per call (it's the one
Anthropic API request that produces the full reading; `/api/hypotheses` is
a much cheaper, shorter call). The `has_completed` flag on `email_captures`
is what prevents someone from generating more than one free reading per
email address — once it's `true` for an email, `/api/generate` returns a 403
without calling Anthropic at all. There's also a simple 20-requests-per-hour
per-IP limit on `/api/generate` as a backstop against a single source
hammering the tool.

## Project structure

```
app/
  page.tsx                 salespage placeholder
  tool/page.tsx             the entire tool (client-side state machine)
  api/
    email-capture/route.ts  stage 1: check/insert email, no AI call
    hypotheses/route.ts     stage 2→3: 2-3 hypotheses from Anthropic
    generate/route.ts       stage 3→4: full reading, has_completed check + update
components/tool/            UI pieces for each stage
lib/                        prompts, product catalog, supabase/rate-limit helpers
```

## What to open first

Start at `app/tool/page.tsx` to see how the four stages fit together, then
`app/api/generate/route.ts` for the core logic (the rate limit, the
has_completed check, the Anthropic call, and the response parsing).
