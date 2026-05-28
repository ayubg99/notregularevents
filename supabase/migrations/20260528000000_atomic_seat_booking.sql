-- Atomic seat booking functions to prevent race conditions.
-- Each function locks the row (FOR UPDATE), checks capacity, and increments in one transaction.

CREATE OR REPLACE FUNCTION book_event_seats(p_event_id UUID, p_quantity INT)
RETURNS jsonb AS $$
DECLARE
  v_capacity INT;
  v_sold     INT;
  v_remaining INT;
BEGIN
  SELECT capacity, tickets_sold
  INTO v_capacity, v_sold
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  v_remaining := v_capacity - v_sold;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'This event is sold out', 'remaining', 0);
  END IF;

  IF p_quantity > v_remaining THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Only %s spot%s left. You requested %s.',
        v_remaining,
        CASE WHEN v_remaining = 1 THEN '' ELSE 's' END,
        p_quantity),
      'remaining', v_remaining
    );
  END IF;

  UPDATE events SET tickets_sold = tickets_sold + p_quantity WHERE id = p_event_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION book_trip_seats(p_trip_id UUID, p_quantity INT)
RETURNS jsonb AS $$
DECLARE
  v_capacity  INT;
  v_sold      INT;
  v_remaining INT;
BEGIN
  SELECT capacity, seats_sold
  INTO v_capacity, v_sold
  FROM trips
  WHERE id = p_trip_id
  FOR UPDATE;

  v_remaining := v_capacity - v_sold;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'This trip is fully booked', 'remaining', 0);
  END IF;

  IF p_quantity > v_remaining THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Only %s spot%s left. You requested %s.',
        v_remaining,
        CASE WHEN v_remaining = 1 THEN '' ELSE 's' END,
        p_quantity),
      'remaining', v_remaining
    );
  END IF;

  UPDATE trips SET seats_sold = seats_sold + p_quantity WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining - p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Free events use the same events table/columns as paid events.
CREATE OR REPLACE FUNCTION book_free_event_seats(p_event_id UUID, p_quantity INT)
RETURNS jsonb AS $$
BEGIN
  RETURN book_event_seats(p_event_id, p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
