-- Replaces book_event_seats with a per-tier-aware version.
-- Atomically checks both global capacity AND per-tier seat limit, then increments.

CREATE OR REPLACE FUNCTION public.book_event_tier_seats(
  p_event_id  UUID,
  p_tier_name TEXT,     -- pass NULL for events with no custom tiers
  p_quantity  INT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity  INT;
  v_sold      INT;
  v_remaining INT;
  v_tier      JSONB;
  v_tier_seats INT;
  v_tier_sold  INT;
BEGIN
  -- Lock event row to prevent concurrent overbooking
  SELECT capacity, tickets_sold
    INTO v_capacity, v_sold
    FROM public.events
   WHERE id = p_event_id
     FOR UPDATE;

  v_remaining := v_capacity - v_sold;

  IF v_remaining < p_quantity THEN
    RETURN jsonb_build_object(
      'success',   false,
      'error',     format('Only %s spot%s left.', v_remaining, CASE WHEN v_remaining = 1 THEN '' ELSE 's' END),
      'remaining', v_remaining
    );
  END IF;

  -- Per-tier capacity check (only when tier name is given and tier has a seats limit)
  IF p_tier_name IS NOT NULL THEN
    SELECT t INTO v_tier
      FROM jsonb_array_elements(
             (SELECT ticket_tiers FROM public.events WHERE id = p_event_id)
           ) AS t
     WHERE t->>'name' = p_tier_name
     LIMIT 1;

    IF v_tier IS NOT NULL AND (v_tier->>'seats') IS NOT NULL THEN
      v_tier_seats := (v_tier->>'seats')::int;

      SELECT COUNT(*) INTO v_tier_sold
        FROM public.event_tickets
       WHERE event_id         = p_event_id
         AND ticket_tier_name = p_tier_name
         AND status NOT IN ('cancelled', 'refunded');

      IF v_tier_sold + p_quantity > v_tier_seats THEN
        RETURN jsonb_build_object(
          'success',   false,
          'error',     'This ticket tier is sold out.',
          'remaining', GREATEST(0, v_tier_seats - v_tier_sold)
        );
      END IF;
    END IF;
  END IF;

  -- All checks passed — increment global counter
  UPDATE public.events
     SET tickets_sold = tickets_sold + p_quantity
   WHERE id = p_event_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$;
