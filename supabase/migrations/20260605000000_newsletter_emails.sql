create table if not exists newsletter_emails (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null unique,
  unsubscribe_token uuid        not null default gen_random_uuid(),
  subscribed_at     timestamptz not null default now()
);

alter table newsletter_emails enable row level security;
