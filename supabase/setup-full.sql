-- =================================================================
-- NOT REGULAR EVENTS — Complete Database Setup (Block 1 of 2)
-- Paste this entire block into Supabase SQL Editor → click "Run"
-- Safe on a blank project; uses IF NOT EXISTS guards throughout
-- =================================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────
-- 2. ENUM TYPES
-- Each DO block creates the type if missing; ignores if it exists.
-- ─────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('student','admin','ambassador'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_status AS ENUM ('draft','published','cancelled','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE event_category AS ENUM (
    'party','cultural','sport','networking','trip','other',
    'language_exchange','food_wine','hiking','yoga','art','international_dinner',
    'club_night','football_screening','artist_night'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('active','used','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM ('draft','published','cancelled','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_tier AS ENUM ('early_bird','standard','vip','group'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('pending','confirmed','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membership_plan AS ENUM ('basic','premium','vip'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membership_status AS ENUM ('active','cancelled','expired','trialing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE discount_type AS ENUM ('percentage','fixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_target AS ENUM ('event','trip'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ambassador_status AS ENUM ('active','inactive','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'booking_confirmed','booking_cancelled','event_reminder','trip_reminder',
    'payment_failed','membership_expiring','new_message','promo','system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE marketplace_status   AS ENUM ('active','sold','reserved','inactive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE marketplace_category AS ENUM (
    'clothes_women','clothes_men','shoes_women','shoes_men','bags_accessories',
    'electronics','furniture','books_studies','kitchen_home','sports_outdoors',
    'beauty_health','bikes_transport','tickets_events','games_hobbies','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE marketplace_condition AS ENUM (
    'new_with_tags','new_without_tags','very_good','good','satisfactory'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Guard for pre-existing DBs that have the old 6-value event_category enum
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'language_exchange';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'food_wine';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'hiking';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'yoga';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'art';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'international_dinner';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'club_night';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'football_screening';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'artist_night';


-- ─────────────────────────────────────────────────────────────────
-- 3. SHARED TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 4. TABLES
-- All columns already incorporate every migration's ADD COLUMN.
-- ─────────────────────────────────────────────────────────────────

-- ── users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        user_role   NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID              NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bio               TEXT,
  nationality       TEXT,
  university        TEXT,
  instagram         TEXT,
  whatsapp          TEXT,
  membership_status membership_status,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT           NOT NULL,
  slug                  TEXT           NOT NULL UNIQUE,
  description           TEXT,
  category              event_category NOT NULL DEFAULT 'other',
  date                  TIMESTAMPTZ    NOT NULL,
  location              TEXT,
  city                  TEXT           DEFAULT NULL,
  image_url             TEXT,
  price                 NUMERIC(10,2)  NOT NULL DEFAULT 0,
  price_early_bird      NUMERIC(10,2),
  price_group           NUMERIC(10,2),
  early_bird_deadline   TIMESTAMPTZ,
  early_bird_seats      INTEGER        NOT NULL DEFAULT 0,
  early_bird_seats_sold INTEGER        NOT NULL DEFAULT 0,
  group_min_size        INTEGER,
  capacity              INTEGER        NOT NULL DEFAULT 100,
  tickets_sold          INTEGER        NOT NULL DEFAULT 0,
  is_free               BOOLEAN        NOT NULL DEFAULT false,
  members_only_free     BOOLEAN        NOT NULL DEFAULT false,
  gallery_images        TEXT[],
  ticket_tiers          JSONB          DEFAULT '[]',
  status                event_status   NOT NULL DEFAULT 'draft',
  created_by            UUID           REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT events_price_non_negative CHECK (price >= 0),
  CONSTRAINT events_capacity_positive  CHECK (capacity > 0),
  CONSTRAINT events_tickets_valid      CHECK (tickets_sold >= 0 AND tickets_sold <= capacity)
);
DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── event_tickets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID          NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           UUID          REFERENCES public.users(id) ON DELETE CASCADE,
  booking_ref       TEXT          NOT NULL UNIQUE,
  qr_code           TEXT,
  status            ticket_status NOT NULL DEFAULT 'active',
  stripe_payment_id TEXT,
  amount_paid       NUMERIC(10,2),
  checked_in        BOOLEAN,
  checked_in_at     TIMESTAMPTZ,
  group_booking_ref TEXT,
  is_group_booking  BOOLEAN       NOT NULL DEFAULT false,
  lead_name         TEXT,
  lead_email        TEXT,
  ambassador_id     UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  referral_code     TEXT,
  ticket_tier_name  TEXT,
  promo_code_used   TEXT,
  guest_name        TEXT,
  guest_email       TEXT,
  guest_phone       TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS event_tickets_updated_at ON public.event_tickets;
CREATE TRIGGER event_tickets_updated_at
  BEFORE UPDATE ON public.event_tickets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── trips ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT         NOT NULL,
  slug                  TEXT         NOT NULL UNIQUE,
  description           TEXT,
  category              TEXT,
  destination           TEXT         NOT NULL,
  start_date            DATE         NOT NULL,
  end_date              DATE         NOT NULL,
  price_early_bird      NUMERIC(10,2),
  price_standard        NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_vip             NUMERIC(10,2),
  price_group           NUMERIC(10,2),
  early_bird_deadline   TIMESTAMPTZ,
  early_bird_seats      INTEGER      NOT NULL DEFAULT 0,
  early_bird_seats_sold INTEGER      NOT NULL DEFAULT 0,
  group_min_size        INTEGER,
  capacity              INTEGER      NOT NULL DEFAULT 50,
  seats_sold            INTEGER      NOT NULL DEFAULT 0,
  image_url             TEXT,
  gallery_images        TEXT[],
  extras                JSONB        DEFAULT '[]',
  status                trip_status  NOT NULL DEFAULT 'draft',
  itinerary             JSONB,
  whats_included        TEXT[],
  whats_excluded        TEXT[],
  meeting_points        TEXT[],
  whatsapp_group_url    TEXT,
  created_by            UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT trips_price_non_negative CHECK (price_standard >= 0),
  CONSTRAINT trips_capacity_positive  CHECK (capacity > 0),
  CONSTRAINT trips_seats_valid        CHECK (seats_sold >= 0 AND seats_sold <= capacity),
  CONSTRAINT trips_dates_valid        CHECK (end_date >= start_date)
);
DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── trip_bookings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_bookings (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id           UUID           NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id           UUID           REFERENCES public.users(id) ON DELETE CASCADE,
  tier              trip_tier      NOT NULL DEFAULT 'standard',
  booking_ref       TEXT           NOT NULL UNIQUE,
  qr_code           TEXT,
  status            booking_status NOT NULL DEFAULT 'confirmed',
  stripe_payment_id TEXT,
  deposit_paid      BOOLEAN        NOT NULL DEFAULT false,
  amount_paid       NUMERIC(10,2),
  quantity          INTEGER        NOT NULL DEFAULT 1,
  checked_in        BOOLEAN,
  checked_in_at     TIMESTAMPTZ,
  ambassador_id     UUID           REFERENCES public.users(id) ON DELETE SET NULL,
  referral_code     TEXT,
  selected_extras   JSONB          DEFAULT '[]',
  promo_code_used   TEXT,
  guest_name        TEXT,
  guest_email       TEXT,
  guest_phone       TEXT,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trip_bookings_updated_at ON public.trip_bookings;
CREATE TRIGGER trip_bookings_updated_at
  BEFORE UPDATE ON public.trip_bookings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── memberships ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memberships (
  id                     UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID              NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan                   membership_plan   NOT NULL,
  status                 membership_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT              UNIQUE,
  stripe_customer_id     TEXT,
  start_date             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  end_date               TIMESTAMPTZ,
  created_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS memberships_updated_at ON public.memberships;
CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── promo_codes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT          NOT NULL UNIQUE,
  discount_type   discount_type NOT NULL,
  discount_value  NUMERIC(10,2) NOT NULL,
  applies_to      TEXT          NOT NULL DEFAULT 'both',
  uses_remaining  INTEGER,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT promo_discount_positive  CHECK (discount_value > 0),
  CONSTRAINT promo_uses_non_negative  CHECK (uses_remaining IS NULL OR uses_remaining >= 0),
  CONSTRAINT promo_percentage_max     CHECK (discount_type != 'percentage' OR discount_value <= 100),
  CONSTRAINT promo_applies_to_check   CHECK (applies_to IN ('events','trips','both'))
);
DROP TRIGGER IF EXISTS promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── reviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type review_target NOT NULL,
  target_id   UUID          NOT NULL,
  rating      SMALLINT      NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id),
  CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── ambassadors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambassadors (
  id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID             NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code    TEXT             NOT NULL UNIQUE,
  total_referrals  INTEGER          NOT NULL DEFAULT 0,
  total_earnings   NUMERIC(10,2)    NOT NULL DEFAULT 0,
  pending_earnings NUMERIC(10,2)    NOT NULL DEFAULT 0,
  paid_earnings    NUMERIC(10,2)    NOT NULL DEFAULT 0,
  commission_rate  NUMERIC(5,2)     NOT NULL DEFAULT 5,
  status           ambassador_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS ambassadors_updated_at ON public.ambassadors;
CREATE TRIGGER ambassadors_updated_at
  BEFORE UPDATE ON public.ambassadors
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── ambassador_commissions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambassador_commissions (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ambassador_id     UUID          NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  booking_type      TEXT          NOT NULL,
  booking_ref       TEXT,
  event_title       TEXT,
  amount_paid       NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate   NUMERIC(5,2)  NOT NULL DEFAULT 5,
  commission_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT          NOT NULL DEFAULT 'pending',
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ambassador_commission_booking_type CHECK (booking_type IN ('event','trip')),
  CONSTRAINT ambassador_commission_status       CHECK (status IN ('pending','paid','cancelled'))
);

-- ── ambassador_rewards ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambassador_rewards (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ambassador_id UUID          NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  reward_type   TEXT          NOT NULL,
  description   TEXT,
  value         NUMERIC(10,2),
  status        TEXT          NOT NULL DEFAULT 'pending',
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ambassador_reward_type   CHECK (reward_type IN ('free_ticket','membership_upgrade','cash_bonus','discount_code')),
  CONSTRAINT ambassador_reward_status CHECK (status IN ('pending','claimed','expired'))
);

-- ── notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  message    TEXT              NOT NULL,
  read       BOOLEAN           NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ       NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS notifications_updated_at ON public.notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── contact_messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ambassador_applications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  university TEXT,
  instagram  TEXT,
  why_join   TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ambassador_app_status CHECK (status IN ('pending','approved','rejected'))
);
DROP TRIGGER IF EXISTS ambassador_applications_updated_at ON public.ambassador_applications;
CREATE TRIGGER ambassador_applications_updated_at
  BEFORE UPDATE ON public.ambassador_applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── housing_listings (community board) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.housing_listings (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  type                    TEXT        NOT NULL DEFAULT 'room_available',
  title                   TEXT        NOT NULL,
  description             TEXT,
  price                   NUMERIC(10,2),
  neighborhood            TEXT,
  room_type               TEXT,
  available_from          DATE,
  available_until         DATE,
  flatmates_count         INTEGER     NOT NULL DEFAULT 0,
  flatmates_nationalities TEXT[]      NOT NULL DEFAULT '{}',
  amenities               TEXT[]      NOT NULL DEFAULT '{}',
  contact_name            TEXT        NOT NULL,
  contact_whatsapp        TEXT,
  contact_email           TEXT,
  nationality             TEXT,
  university              TEXT,
  gender_preference       TEXT        NOT NULL DEFAULT 'any',
  photos                  TEXT[]      NOT NULL DEFAULT '{}',
  status                  TEXT        NOT NULL DEFAULT 'active',
  views                   INTEGER     NOT NULL DEFAULT 0,
  expires_at              TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '60 days',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT housing_type_check   CHECK (type IN ('room_available','looking_for_room')),
  CONSTRAINT housing_status_check CHECK (status IN ('active','inactive','rented'))
);
DROP TRIGGER IF EXISTS housing_listings_updated_at ON public.housing_listings;
CREATE TRIGGER housing_listings_updated_at
  BEFORE UPDATE ON public.housing_listings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── housing_partners (verified landlords) ────────────────────────
CREATE TABLE IF NOT EXISTS public.housing_partners (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_email TEXT        NOT NULL,
  contact_phone TEXT,
  whatsapp      TEXT,
  description   TEXT,
  logo_url      TEXT,
  status        TEXT        NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT housing_partner_status_check CHECK (status IN ('active','inactive'))
);
DROP TRIGGER IF EXISTS housing_partners_updated_at ON public.housing_partners;
CREATE TRIGGER housing_partners_updated_at
  BEFORE UPDATE ON public.housing_partners
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── partner_rooms ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_rooms (
  id                       UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id               UUID          NOT NULL REFERENCES public.housing_partners(id) ON DELETE CASCADE,
  title                    TEXT          NOT NULL,
  slug                     TEXT          UNIQUE,
  description              TEXT,
  neighborhood             TEXT          NOT NULL,
  address                  TEXT,
  room_type                TEXT          NOT NULL DEFAULT 'private_room',
  monthly_rent             NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
  available_from           DATE,
  available_until          DATE,
  flatmates_count          INTEGER       NOT NULL DEFAULT 0,
  flatmates_nationalities  TEXT[]        NOT NULL DEFAULT '{}',
  amenities                TEXT[]        NOT NULL DEFAULT '{}',
  bills_included           BOOLEAN       NOT NULL DEFAULT false,
  gender_preference        TEXT          NOT NULL DEFAULT 'any',
  photos                   TEXT[]        NOT NULL DEFAULT '{}',
  status                   TEXT          NOT NULL DEFAULT 'available',
  featured                 BOOLEAN       NOT NULL DEFAULT false,
  views                    INTEGER       NOT NULL DEFAULT 0,
  contacts_sold            INTEGER       NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT partner_room_status_check CHECK (status IN ('available','reserved','occupied'))
);
DROP TRIGGER IF EXISTS partner_rooms_updated_at ON public.partner_rooms;
CREATE TRIGGER partner_rooms_updated_at
  BEFORE UPDATE ON public.partner_rooms
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── room_contacts (paid landlord contact purchases) ───────────────
CREATE TABLE IF NOT EXISTS public.room_contacts (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id               UUID          REFERENCES public.partner_rooms(id) ON DELETE SET NULL,
  partner_id            UUID          REFERENCES public.housing_partners(id) ON DELETE SET NULL,
  booking_ref           TEXT          NOT NULL UNIQUE,
  guest_name            TEXT          NOT NULL,
  guest_email           TEXT          NOT NULL,
  guest_phone           TEXT,
  guest_nationality     TEXT,
  university            TEXT,
  move_in_date          DATE,
  duration_months       INTEGER       NOT NULL DEFAULT 1,
  message               TEXT,
  platform_fee          NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_payment_id     TEXT,
  status                TEXT          NOT NULL DEFAULT 'pending',
  confirmation_deadline TIMESTAMPTZ,
  confirmed_at          TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  refund_id             TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT room_contact_status_check CHECK (
    status IN ('pending','confirmed','contact_shared','rejected','refunded','cancelled')
  )
);

-- ── sponsors / perks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsors (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL,
  logo_url                TEXT,
  website_url             TEXT,
  description             TEXT,
  discount_text           TEXT,
  discount_code           TEXT,
  redemption_instructions TEXT,
  members_only            BOOLEAN     NOT NULL DEFAULT true,
  category                TEXT        NOT NULL DEFAULT 'general',
  is_featured             BOOLEAN     NOT NULL DEFAULT false,
  status                  TEXT        NOT NULL DEFAULT 'active',
  display_order           INTEGER     NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sponsors_category_check CHECK (
    category IN ('general','food_drink','fitness','nightlife','travel','fashion','tech','other')
  ),
  CONSTRAINT sponsors_status_check CHECK (status IN ('active','inactive'))
);

-- ── party_recap_media ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.party_recap_media (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_url        TEXT        NOT NULL,
  thumbnail_url    TEXT,
  overlay_title    TEXT,
  overlay_subtitle TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  city             TEXT        NOT NULL DEFAULT 'Valencia',
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── newsletter_emails ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_emails (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT        NOT NULL UNIQUE,
  unsubscribe_token UUID        NOT NULL DEFAULT gen_random_uuid(),
  subscribed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── marketplace_listings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id                 UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID                  REFERENCES public.users(id) ON DELETE SET NULL,
  title              TEXT                  NOT NULL,
  description        TEXT,
  price              NUMERIC(10,2)         NOT NULL DEFAULT 0,
  category           marketplace_category  NOT NULL,
  size_clothes       TEXT,
  size_shoes         TEXT,
  condition          marketplace_condition NOT NULL,
  event_date         TEXT,
  event_venue        TEXT,
  ticket_quantity    INTEGER,
  brand              TEXT,
  color              TEXT,
  photos             TEXT[]                NOT NULL DEFAULT '{}',
  location           TEXT                  DEFAULT 'Valencia',
  neighborhood       TEXT,
  contact_whatsapp   TEXT,
  contact_email      TEXT,
  seller_name        TEXT                  NOT NULL,
  seller_nationality TEXT,
  university         TEXT,
  is_free            BOOLEAN               NOT NULL DEFAULT false,
  is_negotiable      BOOLEAN               NOT NULL DEFAULT false,
  status             marketplace_status    NOT NULL DEFAULT 'active',
  views              INTEGER               NOT NULL DEFAULT 0,
  expires_at         TIMESTAMPTZ           NOT NULL DEFAULT now() + INTERVAL '60 days',
  created_at         TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ           NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ─────────────────────────────────────────────────────────────────
-- 5. INDEXES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_status_date    ON public.events(status, date);
CREATE INDEX IF NOT EXISTS idx_events_slug           ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_category       ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by     ON public.events(created_by);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event             ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_user              ON public.event_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_ref               ON public.event_tickets(booking_ref);
CREATE INDEX IF NOT EXISTS idx_event_tickets_created           ON public.event_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_tickets_stripe_payment_id ON public.event_tickets(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_guest_email       ON public.event_tickets(guest_email);

CREATE INDEX IF NOT EXISTS idx_trips_status_date  ON public.trips(status, start_date);
CREATE INDEX IF NOT EXISTS idx_trips_slug         ON public.trips(slug);
CREATE INDEX IF NOT EXISTS idx_trips_destination  ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_created_by   ON public.trips(created_by);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip              ON public.trip_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user              ON public.trip_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_ref               ON public.trip_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_created           ON public.trip_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_stripe_payment_id ON public.trip_bookings(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_guest_email       ON public.trip_bookings(guest_email);

CREATE INDEX IF NOT EXISTS idx_memberships_user               ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status             ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe             ON public.memberships(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON public.memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status        ON public.memberships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON public.reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user   ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created     ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_ambassador_apps_email  ON public.ambassador_applications(email);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_status ON public.ambassador_applications(status);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);


-- ─────────────────────────────────────────────────────────────────
-- 6. AUTH SYNC TRIGGERS
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email,
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'avatar_url',
          'student')
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = COALESCE(EXCLUDED.full_name,  public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = now();
  INSERT INTO public.profiles (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users SET email = NEW.email, updated_at = now() WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_updated();


-- ─────────────────────────────────────────────────────────────────
-- 7. DATABASE FUNCTIONS
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decrement_promo_uses(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.promo_codes
  SET    uses_remaining = GREATEST(uses_remaining - 1, 0),
         updated_at     = now()
  WHERE  id = p_id
    AND  uses_remaining IS NOT NULL
    AND  uses_remaining > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.increment_contacts_sold(p_room_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.partner_rooms
  SET contacts_sold = contacts_sold + 1, updated_at = now()
  WHERE id = p_room_id;
END;
$$;

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
RETURNS TEXT SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
  i          INT;
BEGIN
  SELECT capacity, tickets_sold INTO v_capacity, v_sold
  FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF v_sold + p_quantity > v_capacity THEN RAISE EXCEPTION 'sold_out'; END IF;
  FOR i IN 1..p_quantity LOOP
    INSERT INTO public.event_tickets
      (event_id, user_id, booking_ref, qr_code, stripe_payment_id,
       guest_name, guest_email, guest_phone, status)
    VALUES
      (p_event_id, p_user_id, p_booking_ref, p_qr_code, p_stripe_payment_id,
       p_guest_name, p_guest_email, p_guest_phone, 'active');
    UPDATE public.events SET tickets_sold = tickets_sold + 1 WHERE id = p_event_id;
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
RETURNS TEXT SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE v_capacity INT; v_sold INT;
BEGIN
  SELECT capacity, seats_sold INTO v_capacity, v_sold
  FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF v_sold >= v_capacity THEN RAISE EXCEPTION 'sold_out'; END IF;
  INSERT INTO public.trip_bookings
    (trip_id, user_id, tier, booking_ref, qr_code, stripe_payment_id,
     guest_name, guest_email, guest_phone, status, deposit_paid)
  VALUES
    (p_trip_id, p_user_id, p_tier, p_booking_ref, p_qr_code, p_stripe_payment_id,
     p_guest_name, p_guest_email, p_guest_phone, 'confirmed', true);
  UPDATE public.trips SET seats_sold = seats_sold + 1 WHERE id = p_trip_id;
  RETURN p_booking_ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_event_seats(p_event_id UUID, p_quantity INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_capacity INT; v_sold INT; v_remaining INT;
BEGIN
  SELECT capacity, tickets_sold INTO v_capacity, v_sold
  FROM public.events WHERE id = p_event_id FOR UPDATE;
  v_remaining := v_capacity - v_sold;
  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'This event is sold out', 'remaining', 0);
  END IF;
  IF p_quantity > v_remaining THEN
    RETURN jsonb_build_object('success', false,
      'error', format('Only %s spot%s left. You requested %s.',
        v_remaining, CASE WHEN v_remaining = 1 THEN '' ELSE 's' END, p_quantity),
      'remaining', v_remaining);
  END IF;
  UPDATE public.events SET tickets_sold = tickets_sold + p_quantity WHERE id = p_event_id;
  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$;

CREATE OR REPLACE FUNCTION public.book_free_event_seats(p_event_id UUID, p_quantity INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN public.book_event_seats(p_event_id, p_quantity); END;
$$;

CREATE OR REPLACE FUNCTION public.book_trip_seats(p_trip_id UUID, p_quantity INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_capacity INT; v_sold INT; v_remaining INT;
BEGIN
  SELECT capacity, seats_sold INTO v_capacity, v_sold
  FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  v_remaining := v_capacity - v_sold;
  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'This trip is fully booked', 'remaining', 0);
  END IF;
  IF p_quantity > v_remaining THEN
    RETURN jsonb_build_object('success', false,
      'error', format('Only %s spot%s left. You requested %s.',
        v_remaining, CASE WHEN v_remaining = 1 THEN '' ELSE 's' END, p_quantity),
      'remaining', v_remaining);
  END IF;
  UPDATE public.trips SET seats_sold = seats_sold + p_quantity WHERE id = p_trip_id;
  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$;

CREATE OR REPLACE FUNCTION public.book_event_tier_seats(
  p_event_id  UUID,
  p_tier_name TEXT,
  p_quantity  INT
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_capacity   INT;
  v_sold       INT;
  v_remaining  INT;
  v_tier       JSONB;
  v_tier_seats INT;
  v_tier_sold  INT;
BEGIN
  SELECT capacity, tickets_sold INTO v_capacity, v_sold
  FROM public.events WHERE id = p_event_id FOR UPDATE;
  v_remaining := v_capacity - v_sold;
  IF v_remaining < p_quantity THEN
    RETURN jsonb_build_object('success', false,
      'error', format('Only %s spot%s left.', v_remaining, CASE WHEN v_remaining = 1 THEN '' ELSE 's' END),
      'remaining', v_remaining);
  END IF;
  IF p_tier_name IS NOT NULL THEN
    SELECT t INTO v_tier
    FROM jsonb_array_elements((SELECT ticket_tiers FROM public.events WHERE id = p_event_id)) AS t
    WHERE t->>'name' = p_tier_name LIMIT 1;
    IF v_tier IS NOT NULL AND (v_tier->>'seats') IS NOT NULL THEN
      v_tier_seats := (v_tier->>'seats')::int;
      SELECT COUNT(*) INTO v_tier_sold
      FROM public.event_tickets
      WHERE event_id = p_event_id AND ticket_tier_name = p_tier_name
        AND status NOT IN ('cancelled','refunded');
      IF v_tier_sold + p_quantity > v_tier_seats THEN
        RETURN jsonb_build_object('success', false, 'error', 'This ticket tier is sold out.',
          'remaining', GREATEST(0, v_tier_seats - v_tier_sold));
      END IF;
    END IF;
  END IF;
  UPDATE public.events SET tickets_sold = tickets_sold + p_quantity WHERE id = p_event_id;
  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassadors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_partners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_recap_media      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_emails      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings   ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "users: read own row"  ON public.users;
DROP POLICY IF EXISTS "users: update own row" ON public.users;
CREATE POLICY "users: read own row"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users: update own row" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- profiles
DROP POLICY IF EXISTS "profiles: read own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: read own"   ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- events
DROP POLICY IF EXISTS "events: public read published" ON public.events;
CREATE POLICY "events: public read published" ON public.events FOR SELECT
  USING (status = 'published' OR auth.uid() = created_by);

-- event_tickets
DROP POLICY IF EXISTS "event_tickets: read own"   ON public.event_tickets;
DROP POLICY IF EXISTS "event_tickets: own insert" ON public.event_tickets;
CREATE POLICY "event_tickets: read own"   ON public.event_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_tickets: own insert" ON public.event_tickets FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- trips
DROP POLICY IF EXISTS "trips: public read published" ON public.trips;
CREATE POLICY "trips: public read published" ON public.trips FOR SELECT
  USING (status = 'published' OR auth.uid() = created_by);

-- trip_bookings
DROP POLICY IF EXISTS "trip_bookings: read own"   ON public.trip_bookings;
DROP POLICY IF EXISTS "trip_bookings: own insert" ON public.trip_bookings;
CREATE POLICY "trip_bookings: read own"   ON public.trip_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trip_bookings: own insert" ON public.trip_bookings FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- memberships
DROP POLICY IF EXISTS "memberships: read own" ON public.memberships;
CREATE POLICY "memberships: read own" ON public.memberships FOR SELECT USING (auth.uid() = user_id);

-- promo_codes (guests need to validate codes)
DROP POLICY IF EXISTS "promo_codes: authenticated read" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes: public read"        ON public.promo_codes;
CREATE POLICY "promo_codes: public read" ON public.promo_codes FOR SELECT USING (true);

-- reviews
DROP POLICY IF EXISTS "reviews: public read"               ON public.reviews;
DROP POLICY IF EXISTS "reviews: authenticated insert own"  ON public.reviews;
DROP POLICY IF EXISTS "reviews: update own"                ON public.reviews;
CREATE POLICY "reviews: public read"              ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews: authenticated insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews: update own"               ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ambassadors
DROP POLICY IF EXISTS "ambassadors: read own" ON public.ambassadors;
CREATE POLICY "ambassadors: read own" ON public.ambassadors FOR SELECT USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "notifications: read own"          ON public.notifications;
DROP POLICY IF EXISTS "notifications: update own (mark read)" ON public.notifications;
CREATE POLICY "notifications: read own"               ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: update own (mark read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contact_messages (anyone can submit)
DROP POLICY IF EXISTS "contact_messages: anyone insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages: admin all"     ON public.contact_messages;
CREATE POLICY "contact_messages: anyone insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_messages: admin all"     ON public.contact_messages FOR ALL USING (public.is_admin());

-- ambassador_applications
DROP POLICY IF EXISTS "ambassador_applications: anyone insert" ON public.ambassador_applications;
DROP POLICY IF EXISTS "ambassador_applications: admin all"     ON public.ambassador_applications;
CREATE POLICY "ambassador_applications: anyone insert" ON public.ambassador_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "ambassador_applications: admin all"     ON public.ambassador_applications FOR ALL USING (public.is_admin());

-- housing_listings (public read active; owner can insert/update/delete)
DROP POLICY IF EXISTS "housing_listings: public read active" ON public.housing_listings;
DROP POLICY IF EXISTS "housing_listings: own insert"         ON public.housing_listings;
DROP POLICY IF EXISTS "housing_listings: own update"         ON public.housing_listings;
DROP POLICY IF EXISTS "housing_listings: own delete"         ON public.housing_listings;
DROP POLICY IF EXISTS "housing_listings: anon insert"        ON public.housing_listings;
CREATE POLICY "housing_listings: public read active" ON public.housing_listings FOR SELECT USING (status = 'active');
CREATE POLICY "housing_listings: anon insert"        ON public.housing_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "housing_listings: own update"         ON public.housing_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "housing_listings: own delete"         ON public.housing_listings FOR DELETE USING (auth.uid() = user_id);

-- housing_partners (public read active)
DROP POLICY IF EXISTS "housing_partners: public read active" ON public.housing_partners;
CREATE POLICY "housing_partners: public read active" ON public.housing_partners FOR SELECT USING (status = 'active');

-- partner_rooms (public read available/reserved)
DROP POLICY IF EXISTS "partner_rooms: public read" ON public.partner_rooms;
CREATE POLICY "partner_rooms: public read" ON public.partner_rooms FOR SELECT USING (status IN ('available','reserved'));

-- room_contacts (anon insert; admin all)
DROP POLICY IF EXISTS "room_contacts: anon insert" ON public.room_contacts;
DROP POLICY IF EXISTS "room_contacts: admin all"   ON public.room_contacts;
CREATE POLICY "room_contacts: anon insert" ON public.room_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "room_contacts: admin all"   ON public.room_contacts FOR ALL USING (public.is_admin());

-- sponsors (public read active)
DROP POLICY IF EXISTS "sponsors: public read active" ON public.sponsors;
CREATE POLICY "sponsors: public read active" ON public.sponsors FOR SELECT USING (status = 'active');

-- party_recap_media (public read active)
DROP POLICY IF EXISTS "party_recap_media: public read active" ON public.party_recap_media;
CREATE POLICY "party_recap_media: public read active" ON public.party_recap_media FOR SELECT USING (is_active = true);

-- newsletter_emails (anon insert only)
DROP POLICY IF EXISTS "newsletter_emails: anon insert" ON public.newsletter_emails;
CREATE POLICY "newsletter_emails: anon insert" ON public.newsletter_emails FOR INSERT WITH CHECK (true);

-- marketplace_listings (public read active; own insert/update)
DROP POLICY IF EXISTS "marketplace: public read active" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace: own insert"         ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace: own update"         ON public.marketplace_listings;
CREATE POLICY "marketplace: public read active" ON public.marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "marketplace: own insert"         ON public.marketplace_listings FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "marketplace: own update"         ON public.marketplace_listings FOR UPDATE USING (auth.uid() = user_id);


-- =================================================================
-- DONE — All tables, functions, indexes, and RLS policies created.
-- Now run Block 2 (supabase/seed-events.sql) to insert event data.
-- =================================================================
