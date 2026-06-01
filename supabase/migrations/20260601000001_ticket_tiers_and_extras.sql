ALTER TABLE events        ADD COLUMN IF NOT EXISTS ticket_tiers    jsonb DEFAULT '[]';
ALTER TABLE trips         ADD COLUMN IF NOT EXISTS extras          jsonb DEFAULT '[]';
ALTER TABLE trip_bookings ADD COLUMN IF NOT EXISTS selected_extras jsonb DEFAULT '[]';
