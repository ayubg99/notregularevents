create type marketplace_status   as enum ('active', 'sold', 'reserved', 'inactive');
create type marketplace_category as enum (
  'clothes_women', 'clothes_men', 'shoes_women', 'shoes_men',
  'bags_accessories', 'electronics', 'furniture', 'books_studies',
  'kitchen_home', 'sports_outdoors', 'beauty_health', 'bikes_transport',
  'tickets_events', 'games_hobbies', 'other'
);
create type marketplace_condition as enum (
  'new_with_tags', 'new_without_tags', 'very_good', 'good', 'satisfactory'
);

create table public.marketplace_listings (
  id                 uuid                   primary key default gen_random_uuid(),
  user_id            uuid                   references public.users(id) on delete set null,
  title              text                   not null,
  description        text,
  price              numeric(10,2)          not null default 0,
  category           marketplace_category   not null,
  size_clothes       text,
  size_shoes         text,
  condition          marketplace_condition  not null,
  event_date         text,
  event_venue        text,
  ticket_quantity    integer,
  brand              text,
  color              text,
  photos             text[]                 not null default '{}',
  location           text                   default 'Valencia',
  neighborhood       text,
  contact_whatsapp   text,
  contact_email      text,
  seller_name        text                   not null,
  seller_nationality text,
  university         text,
  is_free            boolean                not null default false,
  is_negotiable      boolean                not null default false,
  status             marketplace_status     not null default 'active',
  views              integer                not null default 0,
  expires_at         timestamptz            not null default now() + interval '60 days',
  created_at         timestamptz            not null default now(),
  updated_at         timestamptz            not null default now()
);

alter table public.marketplace_listings enable row level security;

create policy "marketplace: public read active"
  on public.marketplace_listings for select using (status = 'active');

create policy "marketplace: own insert"
  on public.marketplace_listings for insert
  with check (user_id is null or auth.uid() = user_id);

create policy "marketplace: own update"
  on public.marketplace_listings for update
  using (auth.uid() = user_id);
