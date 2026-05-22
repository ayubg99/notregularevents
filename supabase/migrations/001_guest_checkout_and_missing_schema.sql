-- =============================================================
-- Erasmus Vibe Valencia — Full Migration
-- Run once in Supabase SQL Editor (safe to re-run where noted)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. NEW EVENT_CATEGORY ENUM VALUES
--    Schema has: party, cultural, sport, networking, trip, other
--    Code uses:  + language_exchange, food_wine, hiking,
--                  yoga, art, international_dinner
-- ─────────────────────────────────────────────────────────────

ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'language_exchange';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'food_wine';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'hiking';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'yoga';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'art';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'international_dinner';


-- ─────────────────────────────────────────────────────────────
-- 2. GUEST COLUMNS ON event_tickets
--    + make user_id nullable (guest checkout support)
-- ─────────────────────────────────────────────────────────────

-- Make user_id optional (guests have no account)
-- The FK constraint stays — NULLs are ignored by Postgres FK enforcement
ALTER TABLE public.event_tickets
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;


-- ─────────────────────────────────────────────────────────────
-- 3. GUEST COLUMNS ON trip_bookings
--    + make user_id nullable
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.trip_bookings
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.trip_bookings
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;


-- ─────────────────────────────────────────────────────────────
-- 4. NEW INDEXES
--    stripe_payment_id lookups (booking-status polling)
--    guest_email lookups (admin search)
--    composite membership index (discount check hot path)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_event_tickets_stripe_payment_id
  ON public.event_tickets (stripe_payment_id);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_stripe_payment_id
  ON public.trip_bookings (stripe_payment_id);

CREATE INDEX IF NOT EXISTS idx_event_tickets_guest_email
  ON public.event_tickets (guest_email);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_guest_email
  ON public.trip_bookings (guest_email);

-- Composite index for the active-membership discount check:
-- WHERE user_id = $1 AND status = 'active' AND (end_date IS NULL OR end_date > now())
CREATE INDEX IF NOT EXISTS idx_memberships_user_status
  ON public.memberships (user_id, status);

-- Admin lookups on ambassador_applications by status
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status
  ON public.ambassador_applications (status);


-- ─────────────────────────────────────────────────────────────
-- 5. UPDATED RPC FUNCTIONS
--    Recreated to support:
--      - Optional user_id (NULL = guest booking)
--      - Guest name / email / phone pass-through
--      - Quantity loop for event tickets
--      - Correct overbooking prevention (sold + qty > capacity)
--    NOTE: tickets_sold / seats_sold are still updated by the
--    existing triggers (trg_sync_event_tickets_sold /
--    trg_sync_trip_seats_sold) — do NOT double-update here.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_event_ticket(
  p_event_id          UUID,
  p_booking_ref       TEXT,
  p_qr_code           TEXT,
  p_stripe_payment_id TEXT,
  p_quantity          INT  DEFAULT 1,
  p_user_id           UUID DEFAULT NULL,
  p_guest_name        TEXT DEFAULT NULL,
  p_guest_email       TEXT DEFAULT NULL,
  p_guest_phone       TEXT DEFAULT NULL
)
RETURNS TEXT
SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
  i          INT;
BEGIN
  -- Lock the event row to prevent concurrent overbooking
  SELECT capacity, tickets_sold
    INTO v_capacity, v_sold
    FROM public.events
   WHERE id = p_event_id
     FOR UPDATE;

  IF v_sold + p_quantity > v_capacity THEN
    RAISE EXCEPTION 'sold_out';
  END IF;

  -- Insert one row per ticket (trigger increments tickets_sold each time)
  FOR i IN 1..p_quantity LOOP
    INSERT INTO public.event_tickets
      (event_id, user_id, booking_ref, qr_code, stripe_payment_id,
       guest_name, guest_email, guest_phone, status)
    VALUES
      (p_event_id, p_user_id, p_booking_ref, p_qr_code, p_stripe_payment_id,
       p_guest_name, p_guest_email, p_guest_phone, 'active');
  END LOOP;

  RETURN p_booking_ref;
END;
$$;


CREATE OR REPLACE FUNCTION public.create_trip_booking(
  p_trip_id           UUID,
  p_tier              trip_tier,
  p_booking_ref       TEXT,
  p_qr_code           TEXT,
  p_stripe_payment_id TEXT,
  p_user_id           UUID DEFAULT NULL,
  p_guest_name        TEXT DEFAULT NULL,
  p_guest_email       TEXT DEFAULT NULL,
  p_guest_phone       TEXT DEFAULT NULL
)
RETURNS TEXT
SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
BEGIN
  -- Lock the trip row to prevent concurrent overbooking
  SELECT capacity, seats_sold
    INTO v_capacity, v_sold
    FROM public.trips
   WHERE id = p_trip_id
     FOR UPDATE;

  IF v_sold >= v_capacity THEN
    RAISE EXCEPTION 'sold_out';
  END IF;

  -- Trigger increments seats_sold on INSERT
  INSERT INTO public.trip_bookings
    (trip_id, user_id, tier, booking_ref, qr_code, stripe_payment_id,
     guest_name, guest_email, guest_phone, status, deposit_paid)
  VALUES
    (p_trip_id, p_user_id, p_tier, p_booking_ref, p_qr_code, p_stripe_payment_id,
     p_guest_name, p_guest_email, p_guest_phone, 'confirmed', true);

  RETURN p_booking_ref;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTION (idempotent — safe to re-run)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ─────────────────────────────────────────────────────────────
-- 7. UPDATED RLS POLICIES
-- ─────────────────────────────────────────────────────────────

-- ── 7a. event_tickets INSERT — allow guest bookings ──────────
-- Old policy blocks inserts where user_id IS NULL because
-- NULL = NULL evaluates to NULL (not TRUE) in SQL.
-- New policy: allow when user_id IS NULL (guest) OR matches the
-- authenticated user (logged-in self-booking).

DROP POLICY IF EXISTS "event_tickets: own insert" ON public.event_tickets;
CREATE POLICY "event_tickets: own insert"
  ON public.event_tickets
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);


-- ── 7b. trip_bookings INSERT — allow guest bookings ──────────

DROP POLICY IF EXISTS "trip_bookings: own insert" ON public.trip_bookings;
CREATE POLICY "trip_bookings: own insert"
  ON public.trip_bookings
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);


-- ── 7c. promo_codes — allow anonymous reads ──────────────────
-- Guest users need to validate promo codes during checkout.
-- Promo codes are user-entered strings, not discoverable secrets,
-- so public SELECT is safe (validation is code-string-based anyway).

DROP POLICY IF EXISTS "promo_codes: auth read" ON public.promo_codes;
CREATE POLICY "promo_codes: public read"
  ON public.promo_codes
  FOR SELECT
  USING (true);


-- ── 7d. contact_messages — admin read / management ───────────
-- Currently only has an INSERT policy (anyone can submit).
-- Admins need to read and manage submissions.

DROP POLICY IF EXISTS "contact_messages: admin all" ON public.contact_messages;
CREATE POLICY "contact_messages: admin all"
  ON public.contact_messages
  FOR ALL
  USING (is_admin());


-- ── 7e. ambassador_applications — admin read / management ────

DROP POLICY IF EXISTS "ambassador_applications: admin all" ON public.ambassador_applications;
CREATE POLICY "ambassador_applications: admin all"
  ON public.ambassador_applications
  FOR ALL
  USING (is_admin());


-- =============================================================
-- END OF MIGRATION
-- =============================================================
