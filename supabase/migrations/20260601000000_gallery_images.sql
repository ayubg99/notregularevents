ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
ALTER TABLE trips  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
