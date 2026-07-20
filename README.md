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
| `ACTIVECAMPAIGN_API_URL` | ActiveCampaign → **Settings → Developer** → "API URL". |
| `ACTIVECAMPAIGN_API_KEY` | Same page, "API Key". Used server-side only, to sync each captured email into ActiveCampaign (tag `patternspotter`, list `Pattern Spotter`). The `Pattern Spotter` list must already exist in ActiveCampaign — create it once in the ActiveCampaign dashboard; the tag is created automatically on first use if missing. If either of these two vars is unset, the sync is silently skipped — it never blocks someone from using the tool. |

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
3. In the import screen, expand **Environment Variables** and add all six
   from your `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ANTHROPIC_API_KEY`, `ACTIVECAMPAIGN_API_URL`, `ACTIVECAMPAIGN_API_KEY`.
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

## PDF downloads and email delivery

Both PDF paths share the same generator (`lib/pdf.ts`: title page, styled
sections, a dark CTA page, an about-Beyond-Psychology page), built with
`pdfkit` — pure JavaScript, no headless browser involved:

- **"Download as PDF" button** (on the on-screen reading): calls
  `/api/generate-pdf`, which builds the PDF and streams it straight to the
  browser. Nothing is stored for this path.
- **Emailed PDF**: `/api/generate` builds the same PDF, uploads the result
  to a private Supabase Storage bucket, and pushes a 30-day signed URL into
  an ActiveCampaign custom field for an automation to email out.

An earlier version of this rendered the PDF via `puppeteer-core` +
`@sparticuz/chromium` (real HTML/CSS, closer to the on-screen design) but
that combination hit two separate Vercel-specific failures in production
(file tracing dropping the bundled Chromium binary, then a missing system
library even after fixing that) and was replaced with this `pdfkit` version,
which has no native/binary dependency and can't hit that class of bug.

`lib/pdf.ts` loads the founder photo from `public/pdf-assets/myrthe-photo.png`
if present, otherwise fetches it from `beyondpsychology.eu` at render time.
If neither is available, that spot renders as a plain colored circle instead
of failing. Brand fonts (Abril Fatface, Cormorant Garamond italic, Open
Sans) are loaded from `public/pdf-assets/fonts/` and registered directly
with pdfkit.

## Paid credits (Stripe)

The tool ships with a full paid-credits system, off by default: while it's
off, the tool behaves exactly like the original free, one-reading-per-email
version. Nothing changes until you deliberately turn it on.

**How it works once turned on:** every reading requires a credit. New emails
start at 0 credits — no free reading — matching the salespage copy, which
already advertises "€27 for 5 readings" everywhere. Buying grants 5 credits
for €27; each reading spends one. The "X readings left" count shows on the
question form and the reading itself once you have any credits.

### Turning it on

1. Run this migration once in Supabase's SQL Editor (safe to run anytime,
   even before turning payments on):
   ```sql
   ALTER TABLE email_captures ADD COLUMN IF NOT EXISTS credits_remaining integer not null default 0;
   ```
2. Add these to Vercel's environment variables:

   | Variable | Where it comes from |
   |---|---|
   | `STRIPE_SECRET_KEY` | Stripe Dashboard → **Developers → API keys → Standard keys** → "Secret key" (`sk_live_...` for real payments, `sk_test_...` while testing). Not the "Restricted key" section. |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → **Developers → Webhooks → Add endpoint**. URL: `https://<your-domain>/api/stripe-webhook`. Event to send: `checkout.session.completed`. After creating it, Stripe shows a "Signing secret" (`whsec_...`) — that's this value. |
   | `TESTER_COUPON_CODE` | Any secret word you pick, e.g. `BETATESTER2026`. Anyone who enters it in the "Have a code?" field on the email gate gets 5 free credits, as if they'd just paid — use it to keep letting testers through without charging them. |
   | `PAYMENTS_ENABLED` | Leave unset (or `false`) until you're ready to go live. Set to `true` and redeploy (Vercel's "Redeploy" button is enough — no code change needed) to flip the whole tool over to paid credits. |

3. Redeploy. `PAYMENTS_ENABLED=true` is the actual on/off switch; everything
   else can be configured ahead of time without affecting live visitors.

### How the pieces fit together

- `lib/payments.ts` — the `PAYMENTS_ENABLED` flag and the coupon-code check.
  Every route branches on this flag: unset/false keeps the original
  `has_completed` logic untouched; `true` switches to `credits_remaining`.
- `components/tool/BuyAccess.tsx` — shown instead of the question form when
  someone has 0 credits. "Buy now" calls `/api/create-checkout-session`,
  which creates a Stripe Checkout Session and redirects to Stripe's hosted
  payment page.
- `/api/stripe-webhook` — Stripe calls this after a successful payment
  (`checkout.session.completed`) and it adds 5 credits to that email.
- Since a trip to Stripe's checkout page is a full browser navigation away
  and back, all React state is lost — `app/tool/page.tsx` reconstructs
  everything from the `?checkout=success&email=...&name=...` (or
  `cancelled`) query string on the redirect back, then polls
  `/api/email-capture` briefly (the webhook can take a second or two to
  land) before continuing.

## Project structure

```
app/
  page.tsx                 salespage placeholder
  tool/page.tsx             the entire tool (client-side state machine)
  api/
    email-capture/route.ts  stage 1: check/insert email, no AI call
    hypotheses/route.ts     stage 2→3: 2-3 hypotheses from Anthropic
    generate/route.ts       stage 3→4: full reading, has_completed check + update
    generate-pdf/route.ts   on-demand PDF download (pdfkit, not stored)
    create-checkout-session/route.ts  Stripe Checkout session (paid mode only)
    stripe-webhook/route.ts           grants credits on successful payment
components/tool/            UI pieces for each stage
components/SiteHeader.tsx   logo header, shown on every page via layout.tsx
lib/                        prompts, product catalog, supabase/rate-limit/AC/PDF helpers
public/pdf-assets/          fonts + photo used only by the PDF template
```

## What to open first

Start at `app/tool/page.tsx` to see how the four stages fit together, then
`app/api/generate/route.ts` for the core logic (the rate limit, the
has_completed check, the Anthropic call, and the response parsing).
