# Ooze — find the money oozing out of your accounts

Auto-fetch your accounts via India's Account Aggregator (or drop a statement)
and, in seconds, see exactly how much is oozing out every month — forgotten
trials, duplicates, price creep, blind UPI AutoPay debits — while your SIPs,
EMIs and insurance are recognised and left alone. Plus loan dues, overhead/
unaccounted expenses, and a savings-over-time graph.

> **The product insight:** people don't know their subscription burn, and the
> number is always bigger and uglier than they think. Ooze computes that number
> fast, shows it with brutal specificity, then makes fixing it effortless.

## What's new in this build

- **Rebrand → Ooze** (minimalist black-box wordmark) + new dark/technical
  landing hero under the shadcn structure (`components.json`, `@/components/ui`).
- **Account Aggregator autofetch** — the fast path (no drag-and-drop): discover
  accounts by phone, consent, fetch. Sandbox now; real with a Setu/Finvu TSP.
- **Loans & dues** + **Overhead/unaccounted** sections, optionally enriched by an
  **email scan** (Gmail sandbox; real with Google OAuth).
- **Savings analysis** — average saving, saving-growth, and a real graph driven
  by stored re-audit snapshots.
- **Pricing**: ₹179/mo · ₹1599/yr · ₹99 one-time deep audit.
- **Supabase** persistence (env-gated; `supabase-schema.sql`), JSON fallback.

This repository currently implements **Phase 1 (the core magic) + the Phase 3
paywall placement**, built to be ship-able on its own.

## What works today

- **Landing** → names the pain in rupees, one CTA, no signup.
- **Upload** PDF or CSV, with **password support** for locked bank PDFs.
- **Parsing pipeline**: `pdfjs-dist` text extraction → per-bank adapters (HDFC,
  ICICI, SBI, Axis, Kotak + a strong generic reader) → normalised transactions.
  Fails *loud and helpful* (password / scanned / unrecognised → CSV fallback).
- **Categorisation**: a pre-seeded Indian merchant pack + heuristics resolve
  messy `UPI/…/MANDATE` narrations to clean merchants; **Claude** refines only
  the unknowns (and only narration strings are ever sent off-server).
- **Recurring engine**: clusters charges, detects cadence, and flags
  `forgotten` / `duplicate` / `price-creep` / `trial-converted` /
  `annual-arbitrage` / `autopay`. **SIPs, EMIs, insurance are never marked waste.**
- **The Reveal**: one hero number, counted up — your monthly burn, then the
  forgotten slice.
- **Audit dashboard**: full breakdown (nothing walled), Subscription Health Score,
  endowed-progress cleanup bar, protected-items section.
- **Paywall**: appears when you tap a tracking/reminder *action*, price anchored
  to *your own* detected waste (₹99/mo · ₹799/yr · ₹49 one-time). Razorpay wiring
  is stubbed and clearly marked **test mode** — see Phase 3 below.
- **Privacy**: raw statements are never stored; one-page explainer at `/privacy`.

## Deploy to Vercel

Vercel auto-detects Next.js (build `next build`, Node 20 via `.nvmrc` + `engines`).

1. Push to GitHub, then in Vercel: **Add New → Project → Import** the repo. If
   the code sits in a subfolder, set **Root Directory** to the folder containing
   `package.json`.
2. **Set env vars** (Settings → Environment Variables). For a real deploy:
   - `AUTH_SECRET` — a long random string.
   - **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) —
     **required for persistence.** Vercel's filesystem is read-only/ephemeral, so
     the local JSON store won't survive; with Supabase set, users, OTPs and audit
     snapshots persist across serverless instances. Run `supabase-schema.sql` first.
   - Optional: `ANTHROPIC_API_KEY`, `RAZORPAY_*`, `MSG91_*`, `SETU_AA_*`,
     `GOOGLE_*` to switch each feature from sandbox to real.
3. Deploy. PDF parsing works in production — the pdfjs worker is force-included
   into the audit function via `outputFileTracingIncludes`.

Without Supabase the app still deploys and runs, but auth/premium state is
per-instance and ephemeral — fine for a quick demo, not for real users.

## Run it

Built on **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind 3**. Requires **Node 20+**.

```bash
npm install
cp .env.local.example .env.local   # optional — app runs without any keys
npm run dev                         # http://localhost:3000
```

No keys needed: the **"Try a sample statement"** button runs a realistic
synthetic Indian statement end-to-end, and categorisation falls back to pure
heuristics. Add `ANTHROPIC_API_KEY` to sharpen merchant recognition on the
unknowns.

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
```

## Architecture

```
src/
  app/
    page.tsx                 landing
    audit/page.tsx           the magic loop: upload → loading → reveal → dashboard
    privacy/page.tsx         one-page privacy explainer
    api/audit/route.ts       parse + categorise + audit (Node runtime, no-store)
  lib/
    types.ts                 the shared contract (Transaction, RecurringItem, AuditResult)
    format.ts                ₹ / lakh formatting, IST dates
    merchants.ts             Indian merchant pack + heuristic resolver
    categorise.ts            Claude refinement (narration-only) + heuristic fallback
    recurring.ts             clustering, flags, Health Score, audit assembly
    sample.ts                synthetic demo statement
    parse/pdf.ts             pdfjs extraction + password / scanned handling
    parse/banks.ts           per-bank adapters + CSV fallback
  components/                Reveal, AuditDashboard, LeakCard, Paywall, UploadCard, …
```

Adding a bank = adding one adapter in `parse/banks.ts` behind the common
interface. Plugging in real categorisation never touches UI code.

## Design system

Dark, editorial, calm. Near-black canvas, ivy-green accent `#9DB380` used
sparingly (hero number, positive deltas, primary CTA), muted red/amber for the
leak framing. Typography-forward — numbers are the design, tabular-aligned.
**Lucide icons only, no emoji anywhere.** Reveal number counts up with Framer
Motion (respects `prefers-reduced-motion`). Mobile-first; looks right at 380px.

## Roadmap (per the brief)

- **Phase 2 — robustness (largely done):** 14 bank adapters + credit-card
  statement support (Dr/Cr suffixes, no-balance card rows), a much larger Indian
  merchant pack (DTH, FASTag, edtech, more OTT/SaaS/gym/news), lender pack so
  single-occurrence EMIs are caught, sharper SIP/EMI/insurance classification,
  and **conservative, honest** money-saving math (`potentialAnnualSavings`).
  Parser/classifier tests: `npx tsx scripts/test-parsers.mts` (24 assertions).
  _Still open:_ OCR for scanned PDFs — deferred because it needs native
  PDF→image rasterisation (e.g. `@napi-rs/canvas`); the graceful "scanned →
  use CSV" fallback is in place. Shareable result card is Phase 4.
- **Phase 3 — accounts + payments (done):** phone + OTP auth (first OTP creates
  the account, later ones just log in), premium gating, Razorpay checkout with
  server-side signature verification + a signed webhook (`/api/razorpay/webhook`)
  as the source of truth. **Runs with zero setup for testing:**
  - **Demo number `9800000000`** is always free premium (fixed OTP `9800`) — it
    never hits the paywall, so you can exercise every premium feature. Every
    other number must pay.
  - No SMS provider set → **dev-OTP mode**: the code is shown on screen (test
    mode). Set `MSG91_AUTH_KEY` for real SMS.
  - No Razorpay keys → a clearly-marked **simulated payment**. Set
    `RAZORPAY_KEY_ID/SECRET` (test) for the real Razorpay checkout, and
    `RAZORPAY_WEBHOOK_SECRET` for the webhook.
  - Persistence is a local `.data/rukka.json` store (gitignored). Swap
    `src/lib/server/store.ts` for Supabase in production.

  Server: `src/lib/server/{store,session,otp,razorpay,auth}.ts`; routes under
  `src/app/api/{auth,razorpay}/*`; client auth/paywall in `src/components/auth/*`
  and `components/Paywall.tsx`.
- **Phase 4 — retention/growth:** renewal calendar, WhatsApp reminders,
  cancel-assist deep links, monthly re-audit + trends, GST export.

## Disclaimer

Test build. The sample statement is synthetic demonstration data. Always confirm
charges on your bank's official channel.
