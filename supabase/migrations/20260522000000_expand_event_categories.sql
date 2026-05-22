-- Expand event_category enum for international community platform
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'language_exchange';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'food_wine';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'hiking';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'yoga';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'art';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'international_dinner';
