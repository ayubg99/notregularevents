# Erasmus Vibe Valencia

A full-stack web platform for the Erasmus Vibe student community in Valencia, Spain. Students can discover events and trips, purchase memberships, and manage their bookings. Admins get a full dashboard for managing content and users.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Payments | Stripe Checkout |
| Styling | Tailwind CSS v4 |
| i18n | next-intl |
| Charts | recharts |
| Deployment | Vercel |

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd erasmus-vibe

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in the values (see below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe dashboard → API keys |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe dashboard → Webhooks |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (used for Stripe redirects) | Set to `http://localhost:3000` locally |

## Supabase Setup

1. **Create a project** at [supabase.com](https://supabase.com)
2. **Run migrations** — apply all SQL files in `supabase/migrations/` in order via the Supabase SQL editor or CLI:
   ```bash
   supabase db push
   ```
3. **Enable Auth providers** — in the Supabase dashboard under Authentication → Providers, enable Email/Password (and optionally Google OAuth)
4. **Set admin role** — after signing up, find your user in the `public.users` table and set `role = 'admin'` to access `/admin`

## Stripe Setup

1. Create products and prices in the [Stripe dashboard](https://dashboard.stripe.com)
2. Copy the **publishable key** and **secret key** from API Keys
3. Set up a **webhook endpoint** pointing to `https://your-domain.com/api/webhooks/stripe`
4. Add these Stripe events to the webhook:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy the **webhook signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`

For local webhook testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Vercel Deployment

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local.example` in the Vercel dashboard (use production values)
4. Deploy — Vercel will auto-detect Next.js and use the settings in `vercel.json`

## Project Structure

```
src/
  app/
    (main)/          # Public routes (Navbar + Footer layout)
    admin/           # Admin dashboard (role-protected)
    api/             # API routes (Stripe webhook, admin stats)
    actions/         # Server actions (checkout, admin CRUD, profile)
  components/
    admin/           # Admin-specific components (DataTable, StatsCard, etc.)
    events/          # Event detail components
    trips/           # Trip booking components
    home/            # Landing page sections
    layout/          # Navbar, Footer
  lib/
    supabase/        # Client, server, admin, and middleware helpers
  types/             # TypeScript database types
messages/            # i18n translations (en.json, es.json)
supabase/migrations/ # SQL migration files
```

## Admin Access

Navigate to `/admin` after setting your user's `role` to `'admin'` in the `public.users` Supabase table. The admin area provides:

- **Overview** — bookings activity chart and key metrics
- **Events** — create, edit, publish/unpublish, delete events
- **Trips** — manage trip listings with pricing tiers
- **Users** — view all users and manage roles
- **Bookings** — view all event and trip bookings, export CSV
