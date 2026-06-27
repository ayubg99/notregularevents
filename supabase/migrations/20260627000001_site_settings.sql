-- Table for key/value site settings (hero video, about photos, whatsapp links, etc.)
create table if not exists site_settings (
  key        text primary key,
  value      jsonb        not null,
  updated_at timestamptz  not null default now()
);

-- Allow anonymous reads so public pages can fetch settings
alter table site_settings enable row level security;

create policy "site_settings_public_read" on site_settings
  for select using (true);

-- Writes go through the service role key (bypasses RLS), so no write policy needed.
