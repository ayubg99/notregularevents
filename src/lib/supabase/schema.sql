-- =============================================================
-- Erasmus Vibe Valencia — Supabase PostgreSQL Schema
-- =============================================================

-- ───────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('student', 'admin', 'ambassador');
CREATE TYPE event_status      AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE event_category    AS ENUM ('party', 'cultural', 'sport', 'networking', 'trip', 'other');
CREATE TYPE ticket_status     AS ENUM ('active', 'used', 'cancelled', 'refunded');
CREATE TYPE trip_status       AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE trip_tier         AS ENUM ('early_bird', 'standard', 'vip');
CREATE TYPE booking_status    AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE membership_plan   AS ENUM ('basic', 'premium', 'vip');
CREATE TYPE membership_status AS ENUM ('active', 'cancelled', 'expired', 'trialing');
CREATE TYPE discount_type     AS ENUM ('percentage', 'fixed');
CREATE TYPE review_target     AS ENUM ('event', 'trip');
CREATE TYPE ambassador_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE notification_type AS ENUM (
  'booking_confirmed', 'booking_cancelled', 'event_reminder',
  'trip_reminder', 'payment_failed', 'membership_expiring',
  'new_message', 'promo', 'system'
);

-- ───────────────────────────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- TABLES
-- ───────────────────────────────────────────────────────────────

-- 1. USERS (public mirror of auth.users)
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON public.users (role);

-- 2. PROFILES
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bio               TEXT,
  nationality       TEXT,
  university        TEXT,
  instagram         TEXT,
  whatsapp          TEXT,
  membership_status membership_status DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

-- 3. EVENTS
CREATE TABLE public.events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  category     event_category NOT NULL DEFAULT 'other',
  date         TIMESTAMPTZ NOT NULL,
  location     TEXT,
  image_url    TEXT,
  price        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  capacity     INTEGER NOT NULL DEFAULT 100,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  status       event_status NOT NULL DEFAULT 'draft',
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tickets_sold_non_negative CHECK (tickets_sold >= 0),
  CONSTRAINT capacity_positive        CHECK (capacity > 0),
  CONSTRAINT tickets_not_exceed_cap   CHECK (tickets_sold <= capacity)
);

CREATE INDEX idx_events_slug   ON public.events (slug);
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_date   ON public.events (date);

-- 4. EVENT TICKETS
CREATE TABLE public.event_tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_ref       TEXT NOT NULL UNIQUE,
  qr_code           TEXT,
  status            ticket_status NOT NULL DEFAULT 'active',
  stripe_payment_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_tickets_event_id ON public.event_tickets (event_id);
CREATE INDEX idx_event_tickets_user_id  ON public.event_tickets (user_id);
CREATE INDEX idx_event_tickets_status   ON public.event_tickets (status);

-- 5. TRIPS
CREATE TABLE public.trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  category         TEXT,
  destination      TEXT NOT NULL,
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ NOT NULL,
  price_early_bird NUMERIC(10, 2),
  price_standard   NUMERIC(10, 2) NOT NULL,
  price_vip        NUMERIC(10, 2),
  capacity         INTEGER NOT NULL DEFAULT 30,
  seats_sold       INTEGER NOT NULL DEFAULT 0,
  image_url        TEXT,
  status           trip_status NOT NULL DEFAULT 'draft',
  created_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seats_sold_non_negative CHECK (seats_sold >= 0),
  CONSTRAINT capacity_positive       CHECK (capacity > 0),
  CONSTRAINT seats_not_exceed_cap    CHECK (seats_sold <= capacity),
  CONSTRAINT end_after_start         CHECK (end_date > start_date)
);

CREATE INDEX idx_trips_slug       ON public.trips (slug);
CREATE INDEX idx_trips_status     ON public.trips (status);
CREATE INDEX idx_trips_start_date ON public.trips (start_date);

-- 6. TRIP BOOKINGS
CREATE TABLE public.trip_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier              trip_tier NOT NULL DEFAULT 'standard',
  booking_ref       TEXT NOT NULL UNIQUE,
  qr_code           TEXT,
  status            booking_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  deposit_paid      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_bookings_trip_id ON public.trip_bookings (trip_id);
CREATE INDEX idx_trip_bookings_user_id ON public.trip_bookings (user_id);
CREATE INDEX idx_trip_bookings_status  ON public.trip_bookings (status);

-- 7. MEMBERSHIPS
CREATE TABLE public.memberships (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                   membership_plan NOT NULL DEFAULT 'basic',
  status                 membership_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  start_date             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date               TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_user_id ON public.memberships (user_id);
CREATE INDEX idx_memberships_status  ON public.memberships (status);

-- 8. PROMO CODES
CREATE TABLE public.promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL,
  uses_remaining INTEGER,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discount_value_positive CHECK (discount_value > 0),
  CONSTRAINT uses_remaining_gte_zero CHECK (uses_remaining IS NULL OR uses_remaining >= 0)
);

CREATE INDEX idx_promo_codes_code       ON public.promo_codes (code);
CREATE INDEX idx_promo_codes_expires_at ON public.promo_codes (expires_at);

-- 9. REVIEWS
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type review_target NOT NULL,
  target_id   UUID NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_reviews_user_id   ON public.reviews (user_id);
CREATE INDEX idx_reviews_target    ON public.reviews (target_type, target_id);

-- 10. AMBASSADORS
CREATE TABLE public.ambassadors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code    TEXT NOT NULL UNIQUE,
  total_referrals  INTEGER NOT NULL DEFAULT 0,
  total_earnings   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status           ambassador_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassadors_user_id      ON public.ambassadors (user_id);
CREATE INDEX idx_ambassadors_referral_code ON public.ambassadors (referral_code);
CREATE INDEX idx_ambassadors_status       ON public.ambassadors (status);

-- 11. NOTIFICATIONS
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL DEFAULT 'system',
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_read    ON public.notifications (user_id, read);

-- ───────────────────────────────────────────────────────────────
-- updated_at TRIGGERS (applied to every table)
-- ───────────────────────────────────────────────────────────────
CREATE TRIGGER trg_users_updated_at          BEFORE UPDATE ON public.users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at       BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at         BEFORE UPDATE ON public.events         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_event_tickets_updated_at  BEFORE UPDATE ON public.event_tickets  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated_at          BEFORE UPDATE ON public.trips          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trip_bookings_updated_at  BEFORE UPDATE ON public.trip_bookings  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_memberships_updated_at    BEFORE UPDATE ON public.memberships    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_promo_codes_updated_at    BEFORE UPDATE ON public.promo_codes    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated_at        BEFORE UPDATE ON public.reviews        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ambassadors_updated_at    BEFORE UPDATE ON public.ambassadors    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notifications_updated_at  BEFORE UPDATE ON public.notifications  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ───────────────────────────────────────────────────────────────
-- TRIGGER: auto-create user + profile on auth.users insert
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id, nationality, university)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'nationality',
    NEW.raw_user_meta_data ->> 'university'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nationality = COALESCE(EXCLUDED.nationality, profiles.nationality),
    university  = COALESCE(EXCLUDED.university,  profiles.university);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ───────────────────────────────────────────────────────────────
-- TRIGGER: keep tickets_sold / seats_sold in sync
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_event_tickets_sold()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.events SET tickets_sold = tickets_sold + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status <> 'active' THEN
      UPDATE public.events SET tickets_sold = tickets_sold - 1 WHERE id = NEW.event_id;
    ELSIF OLD.status <> 'active' AND NEW.status = 'active' THEN
      UPDATE public.events SET tickets_sold = tickets_sold + 1 WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.events SET tickets_sold = tickets_sold - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_event_tickets_sold
  AFTER INSERT OR UPDATE OR DELETE ON public.event_tickets
  FOR EACH ROW EXECUTE FUNCTION sync_event_tickets_sold();

CREATE OR REPLACE FUNCTION sync_trip_seats_sold()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.trips SET seats_sold = seats_sold + 1 WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status <> 'confirmed' THEN
      UPDATE public.trips SET seats_sold = seats_sold - 1 WHERE id = NEW.trip_id;
    ELSIF OLD.status <> 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE public.trips SET seats_sold = seats_sold + 1 WHERE id = NEW.trip_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE public.trips SET seats_sold = seats_sold - 1 WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_trip_seats_sold
  AFTER INSERT OR UPDATE OR DELETE ON public.trip_bookings
  FOR EACH ROW EXECUTE FUNCTION sync_trip_seats_sold();

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassadors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── users ──────────────────────────────────────────────────────
CREATE POLICY "users: own read"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users: own update" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users: admin all"  ON public.users FOR ALL    USING (is_admin());

-- ── profiles ───────────────────────────────────────────────────
CREATE POLICY "profiles: own read"   ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles: admin all"  ON public.profiles FOR ALL    USING (is_admin());

-- ── events ─────────────────────────────────────────────────────
-- Anyone (incl. anon) can read published events
CREATE POLICY "events: public read published" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "events: admin all" ON public.events FOR ALL USING (is_admin());

-- ── event_tickets ──────────────────────────────────────────────
CREATE POLICY "event_tickets: own read"   ON public.event_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_tickets: own insert" ON public.event_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_tickets: admin all"  ON public.event_tickets FOR ALL    USING (is_admin());

-- ── trips ──────────────────────────────────────────────────────
CREATE POLICY "trips: public read published" ON public.trips
  FOR SELECT USING (status = 'published');

CREATE POLICY "trips: admin all" ON public.trips FOR ALL USING (is_admin());

-- ── trip_bookings ──────────────────────────────────────────────
CREATE POLICY "trip_bookings: own read"   ON public.trip_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trip_bookings: own insert" ON public.trip_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trip_bookings: admin all"  ON public.trip_bookings FOR ALL    USING (is_admin());

-- ── memberships ────────────────────────────────────────────────
CREATE POLICY "memberships: own read"  ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memberships: admin all" ON public.memberships FOR ALL    USING (is_admin());

-- ── promo_codes ────────────────────────────────────────────────
-- Auth users can SELECT (to validate a code); only admins can mutate
CREATE POLICY "promo_codes: auth read"  ON public.promo_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "promo_codes: admin all"  ON public.promo_codes FOR ALL    USING (is_admin());

-- ── reviews ────────────────────────────────────────────────────
CREATE POLICY "reviews: public read"   ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews: auth insert"   ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews: own update"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews: own delete"    ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "reviews: admin all"     ON public.reviews FOR ALL    USING (is_admin());

-- ── ambassadors ────────────────────────────────────────────────
CREATE POLICY "ambassadors: own read"  ON public.ambassadors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ambassadors: admin all" ON public.ambassadors FOR ALL    USING (is_admin());

-- ── notifications ──────────────────────────────────────────────
CREATE POLICY "notifications: own read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: own update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications: admin all"  ON public.notifications FOR ALL    USING (is_admin());

-- ───────────────────────────────────────────────────────────────
-- MIGRATION: Trips detail fields + Group tier
-- Run once in Supabase SQL editor (safe to re-run — all IF NOT EXISTS)
-- ───────────────────────────────────────────────────────────────

ALTER TYPE trip_tier ADD VALUE IF NOT EXISTS 'group';

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS price_group        NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS itinerary          JSONB,
  ADD COLUMN IF NOT EXISTS whats_included     TEXT[],
  ADD COLUMN IF NOT EXISTS whats_excluded     TEXT[],
  ADD COLUMN IF NOT EXISTS meeting_points     TEXT[],
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- ───────────────────────────────────────────────────────────────
-- MIGRATION: Stripe payment — atomic booking functions
-- Run once in Supabase SQL editor
-- ───────────────────────────────────────────────────────────────

-- Atomic event ticket creation with overbooking prevention
CREATE OR REPLACE FUNCTION create_event_ticket(
  p_event_id          UUID,
  p_user_id           UUID,
  p_booking_ref       TEXT,
  p_qr_code           TEXT,
  p_stripe_payment_id TEXT
) RETURNS UUID
SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
  v_id       UUID;
BEGIN
  SELECT capacity, tickets_sold
    INTO v_capacity, v_sold
    FROM public.events
   WHERE id = p_event_id
     FOR UPDATE;

  IF v_sold >= v_capacity THEN
    RAISE EXCEPTION 'sold_out';
  END IF;

  INSERT INTO public.event_tickets
    (event_id, user_id, booking_ref, qr_code, stripe_payment_id, status)
  VALUES
    (p_event_id, p_user_id, p_booking_ref, p_qr_code, p_stripe_payment_id, 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Atomic trip booking creation with overbooking prevention
CREATE OR REPLACE FUNCTION create_trip_booking(
  p_trip_id           UUID,
  p_user_id           UUID,
  p_tier              trip_tier,
  p_booking_ref       TEXT,
  p_qr_code           TEXT,
  p_stripe_payment_id TEXT
) RETURNS UUID
SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
  v_id       UUID;
BEGIN
  SELECT capacity, seats_sold
    INTO v_capacity, v_sold
    FROM public.trips
   WHERE id = p_trip_id
     FOR UPDATE;

  IF v_sold >= v_capacity THEN
    RAISE EXCEPTION 'sold_out';
  END IF;

  INSERT INTO public.trip_bookings
    (trip_id, user_id, tier, booking_ref, qr_code, stripe_payment_id, status, deposit_paid)
  VALUES
    (p_trip_id, p_user_id, p_tier, p_booking_ref, p_qr_code, p_stripe_payment_id, 'confirmed', true)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Safe promo code use decrement (no-op if uses_remaining is null)
CREATE OR REPLACE FUNCTION decrement_promo_uses(p_id UUID)
RETURNS VOID
SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.promo_codes
     SET uses_remaining = uses_remaining - 1
   WHERE id = p_id
     AND uses_remaining IS NOT NULL
     AND uses_remaining > 0;
END;
$$;

-- =============================================================
-- Migration: Contact messages + Ambassador applications
-- =============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  university TEXT        NOT NULL,
  instagram  TEXT,
  why_join   TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"   ON public.contact_messages        FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can apply ambassador" ON public.ambassador_applications FOR INSERT WITH CHECK (true);
