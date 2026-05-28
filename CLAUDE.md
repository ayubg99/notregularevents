# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server with Turbopack
npm run build    # production build
npm run lint     # ESLint (0 errors required; 2 pre-existing <img> warnings are acceptable)
```

No test suite exists. Stripe webhook testing locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Project Overview

Erasmus Vibe is a community platform for international students in Valencia, Spain — event/trip booking, housing marketplace, and membership subscriptions.

**Stack:** Next.js App Router, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Stripe, Resend  
**Brand colors:** `#FF6B35` coral-orange (primary), `#F5A623` gold (accent), `#1A1A2E` dark navy (bg), `#1A1200` warm dark brown (card bg)  
**Fonts:** Inter for UI, Clash Display (`font-heading`) for headings

## Route Groups

- `(main)/` — public pages with shared Navbar+Footer layout
- `admin/` — role-protected admin dashboard; role is checked inside each route handler, not in middleware
- `scanner/` — standalone QR check-in page (no shared layout)
- `api/` — REST endpoints grouped by domain: `stripe/`, `events/`, `trips/`, `housing/`, `scanner/`, `admin/`

## Supabase Client Pattern

Four distinct clients — use the right one:

| Client | File | When to use |
|--------|------|-------------|
| `createClient()` server | `src/lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions |
| `createClient()` browser | `src/lib/supabase/client.ts` | Client Components (`'use client'`) |
| `getAdminClient()` | `src/lib/supabase/admin.ts` | Webhook handlers, admin mutations — bypasses RLS via service role key |
| `getPublicClient()` | `src/lib/supabase/public.ts` | Cookie-free anonymous reads in static contexts |

Cached queries (deduplicated per render via React `cache()`) live in `src/lib/supabase/queries.ts`.

Session refresh is handled by `updateSession()` in `src/lib/supabase/middleware.ts`.

## Payment Flow (Stripe)

1. **Checkout** (`POST /api/stripe/create-checkout`): builds a Stripe session with all booking metadata. Free items bypass Stripe — tickets are inserted directly into the DB.
2. **Webhook** (`POST /api/stripe/webhook`): on `checkout.session.completed`, creates DB records, generates QR codes via the `qrcode` package, decrements seat counters via RPC, and sends confirmation emails.
3. **Polling** (`GET /api/stripe/booking-status`): the `/booking/success` page polls this until the webhook has written the ticket/booking.

Pricing precedence: early-bird (if seats + deadline remain) → standard → promo discount → 15% member discount.

## Email

Resend singleton at `src/lib/resend.ts`. All send functions live in `src/lib/email.ts`. QR codes must be converted from data URLs to Buffer before attaching — email clients block `data:` URLs. From address: `RESEND_FROM_EMAIL` env var.

## Key DB Entities

- `event_tickets` — one row per ticket; `booking_ref`, `qr_code`, `status`, `checked_in_at`
- `trip_bookings` — one row per booking; tier, deposit info, check-in
- `memberships` — Stripe subscription state; kept in sync by the webhook
- `promo_codes` — decremented after payment via `decrement_promo_uses()` RPC
- `partner_rooms` / `room_contacts` — housing marketplace; contact purchase opens a 48h landlord confirmation window with auto-refund fallback

DB types are auto-generated in `src/types/database.ts`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC / _PREMIUM / _VIP
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_SCANNER_PIN   # optional, QR check-in PIN
```
