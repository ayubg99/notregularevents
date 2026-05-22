-- =============================================================
-- Erasmus Vibe Valencia — Initial Schema
-- =============================================================
-- Run order:
--   1. Extensions
--   2. Enums
--   3. Tables (dependency order)
--   4. Indexes
--   5. Functions & Triggers
--   6. RLS Policies
--   7. Storage Buckets
-- =============================================================

-- ── Extensions ────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────────

create type user_role as enum ('student', 'admin', 'ambassador');
create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type event_category as enum ('party', 'cultural', 'sport', 'networking', 'trip', 'other');
create type ticket_status as enum ('active', 'used', 'cancelled', 'refunded');
create type trip_status as enum ('draft', 'published', 'cancelled', 'completed');
create type trip_tier as enum ('early_bird', 'standard', 'vip', 'group');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'refunded');
create type membership_plan as enum ('basic', 'premium', 'vip');
create type membership_status as enum ('active', 'cancelled', 'expired', 'trialing');
create type discount_type as enum ('percentage', 'fixed');
create type review_target as enum ('event', 'trip');
create type ambassador_status as enum ('active', 'inactive', 'suspended');
create type notification_type as enum (
  'booking_confirmed',
  'booking_cancelled',
  'event_reminder',
  'trip_reminder',
  'payment_failed',
  'membership_expiring',
  'new_message',
  'promo',
  'system'
);

-- ── updated_at trigger function (shared) ──────────────────────

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- TABLES
-- =============================================================

-- ── users ─────────────────────────────────────────────────────
-- Mirrors auth.users. Auto-populated by trigger on sign-up.

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function handle_updated_at();

-- ── profiles ──────────────────────────────────────────────────

create table public.profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null unique references public.users(id) on delete cascade,
  bio               text,
  nationality       text,
  university        text,
  instagram         text,
  whatsapp          text,
  membership_status membership_status,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function handle_updated_at();

-- ── events ────────────────────────────────────────────────────

create table public.events (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  description  text,
  category     event_category not null default 'other',
  date         timestamptz not null,
  location     text,
  image_url    text,
  price        numeric(10,2) not null default 0,
  capacity     integer not null default 100,
  tickets_sold integer not null default 0,
  status       event_status not null default 'draft',
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint events_price_non_negative check (price >= 0),
  constraint events_capacity_positive  check (capacity > 0),
  constraint events_tickets_valid      check (tickets_sold >= 0 and tickets_sold <= capacity)
);

create trigger events_updated_at
  before update on public.events
  for each row execute function handle_updated_at();

-- ── event_tickets ─────────────────────────────────────────────

create table public.event_tickets (
  id                 uuid primary key default uuid_generate_v4(),
  event_id           uuid not null references public.events(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  booking_ref        text not null unique,
  qr_code            text,
  status             ticket_status not null default 'active',
  stripe_payment_id  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger event_tickets_updated_at
  before update on public.event_tickets
  for each row execute function handle_updated_at();

-- ── trips ─────────────────────────────────────────────────────

create table public.trips (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  slug               text not null unique,
  description        text,
  category           text,
  destination        text not null,
  start_date         date not null,
  end_date           date not null,
  price_early_bird   numeric(10,2),
  price_standard     numeric(10,2) not null default 0,
  price_vip          numeric(10,2),
  price_group        numeric(10,2),
  capacity           integer not null default 50,
  seats_sold         integer not null default 0,
  image_url          text,
  status             trip_status not null default 'draft',
  itinerary          jsonb,
  whats_included     text[],
  whats_excluded     text[],
  meeting_points     text[],
  whatsapp_group_url text,
  created_by         uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint trips_price_non_negative  check (price_standard >= 0),
  constraint trips_capacity_positive   check (capacity > 0),
  constraint trips_seats_valid         check (seats_sold >= 0 and seats_sold <= capacity),
  constraint trips_dates_valid         check (end_date >= start_date)
);

create trigger trips_updated_at
  before update on public.trips
  for each row execute function handle_updated_at();

-- ── trip_bookings ─────────────────────────────────────────────

create table public.trip_bookings (
  id                 uuid primary key default uuid_generate_v4(),
  trip_id            uuid not null references public.trips(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  tier               trip_tier not null default 'standard',
  booking_ref        text not null unique,
  qr_code            text,
  status             booking_status not null default 'confirmed',
  stripe_payment_id  text,
  deposit_paid       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger trip_bookings_updated_at
  before update on public.trip_bookings
  for each row execute function handle_updated_at();

-- ── memberships ───────────────────────────────────────────────
-- One active membership per user (upsert on user_id).

create table public.memberships (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null unique references public.users(id) on delete cascade,
  plan                   membership_plan not null,
  status                 membership_status not null default 'active',
  stripe_subscription_id text unique,
  start_date             timestamptz not null default now(),
  end_date               timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger memberships_updated_at
  before update on public.memberships
  for each row execute function handle_updated_at();

-- ── promo_codes ───────────────────────────────────────────────

create table public.promo_codes (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  discount_type   discount_type not null,
  discount_value  numeric(10,2) not null,
  uses_remaining  integer,               -- null = unlimited
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint promo_discount_positive    check (discount_value > 0),
  constraint promo_uses_non_negative    check (uses_remaining is null or uses_remaining >= 0),
  constraint promo_percentage_max       check (discount_type != 'percentage' or discount_value <= 100)
);

create trigger promo_codes_updated_at
  before update on public.promo_codes
  for each row execute function handle_updated_at();

-- ── reviews ───────────────────────────────────────────────────

create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  target_type review_target not null,
  target_id   uuid not null,
  rating      smallint not null,
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One review per user per event/trip
  unique (user_id, target_type, target_id),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function handle_updated_at();

-- ── ambassadors ───────────────────────────────────────────────

create table public.ambassadors (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references public.users(id) on delete cascade,
  referral_code    text not null unique,
  total_referrals  integer not null default 0,
  total_earnings   numeric(10,2) not null default 0,
  status           ambassador_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger ambassadors_updated_at
  before update on public.ambassadors
  for each row execute function handle_updated_at();

-- ── notifications ─────────────────────────────────────────────

create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       notification_type not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notifications_updated_at
  before update on public.notifications
  for each row execute function handle_updated_at();

-- ── contact_messages ──────────────────────────────────────────

create table public.contact_messages (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ── ambassador_applications ───────────────────────────────────

create table public.ambassador_applications (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  university text not null,
  instagram  text,
  why_join   text not null,
  status     text not null default 'pending',  -- pending | approved | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ambassador_app_status check (status in ('pending', 'approved', 'rejected'))
);

create trigger ambassador_applications_updated_at
  before update on public.ambassador_applications
  for each row execute function handle_updated_at();

-- =============================================================
-- INDEXES
-- =============================================================

-- events
create index idx_events_status_date   on public.events(status, date);
create index idx_events_slug          on public.events(slug);
create index idx_events_category      on public.events(category);
create index idx_events_created_by    on public.events(created_by);

-- event_tickets
create index idx_event_tickets_event   on public.event_tickets(event_id);
create index idx_event_tickets_user    on public.event_tickets(user_id);
create index idx_event_tickets_ref     on public.event_tickets(booking_ref);
create index idx_event_tickets_created on public.event_tickets(created_at desc);

-- trips
create index idx_trips_status_date    on public.trips(status, start_date);
create index idx_trips_slug           on public.trips(slug);
create index idx_trips_destination    on public.trips(destination);
create index idx_trips_created_by     on public.trips(created_by);

-- trip_bookings
create index idx_trip_bookings_trip    on public.trip_bookings(trip_id);
create index idx_trip_bookings_user    on public.trip_bookings(user_id);
create index idx_trip_bookings_ref     on public.trip_bookings(booking_ref);
create index idx_trip_bookings_created on public.trip_bookings(created_at desc);

-- memberships
create index idx_memberships_user      on public.memberships(user_id);
create index idx_memberships_status    on public.memberships(status);
create index idx_memberships_stripe    on public.memberships(stripe_subscription_id);

-- reviews
create index idx_reviews_target on public.reviews(target_type, target_id);
create index idx_reviews_user   on public.reviews(user_id);

-- notifications
create index idx_notifications_user_unread on public.notifications(user_id, read);
create index idx_notifications_created     on public.notifications(created_at desc);

-- profiles
create index idx_profiles_user on public.profiles(user_id);

-- ambassador_applications
create index idx_ambassador_apps_email  on public.ambassador_applications(email);
create index idx_ambassador_apps_status on public.ambassador_applications(status);

-- contact_messages
create index idx_contact_messages_created on public.contact_messages(created_at desc);

-- =============================================================
-- AUTH SYNC TRIGGER
-- Auto-creates public.users row on Supabase auth sign-up
-- =============================================================

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'student'
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, public.users.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        updated_at = now();

  -- Auto-create an empty profile
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Also sync email updates from auth
create or replace function handle_auth_user_updated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.users
  set email      = new.email,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function handle_auth_user_updated();

-- =============================================================
-- BOOKING FUNCTIONS (atomic, capacity-checked)
-- =============================================================

-- ── create_event_ticket ───────────────────────────────────────

create or replace function create_event_ticket(
  p_event_id          uuid,
  p_user_id           uuid,
  p_booking_ref       text,
  p_qr_code           text,
  p_stripe_payment_id text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_ticket_id uuid;
  v_capacity  integer;
  v_sold      integer;
begin
  -- Lock the event row to prevent race conditions
  select capacity, tickets_sold
  into   v_capacity, v_sold
  from   public.events
  where  id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found: %', p_event_id;
  end if;

  if v_sold >= v_capacity then
    raise exception 'Event is sold out';
  end if;

  -- Insert ticket
  insert into public.event_tickets (
    event_id, user_id, booking_ref, qr_code, status, stripe_payment_id
  )
  values (
    p_event_id, p_user_id, p_booking_ref, p_qr_code, 'active', p_stripe_payment_id
  )
  returning id into v_ticket_id;

  -- Increment counter
  update public.events
  set    tickets_sold = tickets_sold + 1,
         updated_at   = now()
  where  id = p_event_id;

  return v_ticket_id;
end;
$$;

-- ── create_trip_booking ───────────────────────────────────────

create or replace function create_trip_booking(
  p_trip_id           uuid,
  p_user_id           uuid,
  p_tier              trip_tier,
  p_booking_ref       text,
  p_qr_code           text,
  p_stripe_payment_id text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_booking_id uuid;
  v_capacity   integer;
  v_sold       integer;
begin
  -- Lock the trip row to prevent race conditions
  select capacity, seats_sold
  into   v_capacity, v_sold
  from   public.trips
  where  id = p_trip_id
  for update;

  if not found then
    raise exception 'Trip not found: %', p_trip_id;
  end if;

  if v_sold >= v_capacity then
    raise exception 'Trip is fully booked';
  end if;

  -- Insert booking
  insert into public.trip_bookings (
    trip_id, user_id, tier, booking_ref, qr_code, status, stripe_payment_id
  )
  values (
    p_trip_id, p_user_id, p_tier, p_booking_ref, p_qr_code, 'confirmed', p_stripe_payment_id
  )
  returning id into v_booking_id;

  -- Increment counter
  update public.trips
  set    seats_sold  = seats_sold + 1,
         updated_at  = now()
  where  id = p_trip_id;

  return v_booking_id;
end;
$$;

-- ── decrement_promo_uses ──────────────────────────────────────

create or replace function decrement_promo_uses(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.promo_codes
  set    uses_remaining = greatest(uses_remaining - 1, 0),
         updated_at     = now()
  where  id = p_id
    and  uses_remaining is not null
    and  uses_remaining > 0;
end;
$$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.users                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.events                 enable row level security;
alter table public.event_tickets          enable row level security;
alter table public.trips                  enable row level security;
alter table public.trip_bookings          enable row level security;
alter table public.memberships            enable row level security;
alter table public.promo_codes            enable row level security;
alter table public.reviews                enable row level security;
alter table public.ambassadors            enable row level security;
alter table public.notifications          enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.ambassador_applications enable row level security;

-- ── users ─────────────────────────────────────────────────────

create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── profiles ──────────────────────────────────────────────────

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── events ────────────────────────────────────────────────────

create policy "events: public read published"
  on public.events for select
  using (status = 'published' or auth.uid() = created_by);

-- (Writes go through service-role in admin server actions — no anon write policy needed)

-- ── event_tickets ─────────────────────────────────────────────

create policy "event_tickets: read own"
  on public.event_tickets for select
  using (auth.uid() = user_id);

-- ── trips ─────────────────────────────────────────────────────

create policy "trips: public read published"
  on public.trips for select
  using (status = 'published' or auth.uid() = created_by);

-- ── trip_bookings ─────────────────────────────────────────────

create policy "trip_bookings: read own"
  on public.trip_bookings for select
  using (auth.uid() = user_id);

-- ── memberships ───────────────────────────────────────────────

create policy "memberships: read own"
  on public.memberships for select
  using (auth.uid() = user_id);

-- ── promo_codes ───────────────────────────────────────────────

create policy "promo_codes: authenticated read"
  on public.promo_codes for select
  to authenticated
  using (true);

-- ── reviews ───────────────────────────────────────────────────

create policy "reviews: public read"
  on public.reviews for select
  using (true);

create policy "reviews: authenticated insert own"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "reviews: update own"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── ambassadors ───────────────────────────────────────────────

create policy "ambassadors: read own"
  on public.ambassadors for select
  using (auth.uid() = user_id);

-- ── notifications ─────────────────────────────────────────────

create policy "notifications: read own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: update own (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── contact_messages ──────────────────────────────────────────
-- Anyone (including anon) can submit; only service-role reads.

create policy "contact_messages: anyone insert"
  on public.contact_messages for insert
  with check (true);

-- ── ambassador_applications ───────────────────────────────────

create policy "ambassador_applications: anyone insert"
  on public.ambassador_applications for insert
  with check (true);
