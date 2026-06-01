-- Add promo_code_used and ticket_tier_name to booking tables
-- so admins can see which promo/referral/tier was used in each booking.

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS ticket_tier_name TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_used  TEXT;

ALTER TABLE public.trip_bookings
  ADD COLUMN IF NOT EXISTS promo_code_used  TEXT;
