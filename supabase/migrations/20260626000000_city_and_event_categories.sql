-- Add city column to events for multi-city tab filtering
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL;

-- Add new event category values for nightlife / football events
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'club_night';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'football_screening';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'artist_night';
