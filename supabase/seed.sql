-- =============================================================
-- Erasmus Life Valencia — Sample Data Seed
-- Run AFTER all migrations (001 through 20260601000003)
-- =============================================================

-- ── Events ────────────────────────────────────────────────────

INSERT INTO public.events (
  title, slug, description, category,
  location, date, capacity, tickets_sold,
  price, price_early_bird,
  is_free, members_only_free,
  image_url, status,
  ticket_tiers
) VALUES

(
  'International Monday — Akuarela Beach',
  'international-monday-akuarela',
  'The biggest international Monday night in Valencia! Free entry before 1am. Dance on the beach terrace with international music all night. Meet students from 50+ countries.',
  'party',
  'Akuarela Beach Club, Playa de la Malvarrosa',
  NOW() + interval '6 days',
  300, 187,
  5, NULL,
  false, false,
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  'published',
  '[
    {"id":"free-entry","name":"Free Entry","price":0,"description":"Valid before 01:00 — members only","seats":100,"members_only":true,"valid_until_time":"01:00","benefits":[],"min_group_size":null,"activates_after":null},
    {"id":"guestlist","name":"Guestlist","price":5,"description":"Guaranteed entry + welcome drink","seats":150,"members_only":false,"valid_until_time":null,"benefits":["Welcome drink"],"min_group_size":null,"activates_after":null},
    {"id":"vip-table","name":"VIP Table","price":50,"description":"Private table + bottle service (min 4)","seats":10,"members_only":false,"valid_until_time":null,"benefits":["Private table","Bottle service"],"min_group_size":4,"activates_after":null},
    {"id":"door-price","name":"Door Price","price":15,"description":"Entry after guestlist closes","seats":50,"members_only":false,"valid_until_time":null,"benefits":[],"min_group_size":null,"activates_after":"guestlist"}
  ]'::jsonb
),

(
  'Beer Pong Tournament — Beracay Club',
  'beerpong-tuesday-beracay',
  'Join the most fun Tuesday night in Valencia! Beer Pong tournament from 11pm. WIN A FREE TRIP for the winning team! Free entrance included.',
  'party',
  'Beracay Club, Valencia',
  NOW() + interval '2 days',
  200, 134,
  8, NULL,
  false, false,
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
  'published',
  '[
    {"id":"free-entry","name":"Free Entry","price":0,"description":"Free entrance — first come first served","seats":100,"members_only":false,"valid_until_time":"23:30","benefits":[],"min_group_size":null,"activates_after":null},
    {"id":"beer-pong-team","name":"Beer Pong Team","price":8,"description":"2-3 people per team. WIN A FREE TRIP!","seats":50,"members_only":false,"valid_until_time":null,"benefits":["Tournament entry","Chance to win free trip"],"min_group_size":2,"activates_after":null},
    {"id":"members-price","name":"Members Price","price":6,"description":"Members price — Beer Pong team entry","seats":20,"members_only":true,"valid_until_time":null,"benefits":["Tournament entry","Member discount"],"min_group_size":2,"activates_after":null}
  ]'::jsonb
),

(
  'International Wednesday — MYA Club',
  'international-wednesday-mya',
  'FREE ENTRANCE all night at MYA Valencia. Open until 7AM. International music, best crowd in Valencia every Wednesday night. The midweek party you cannot miss.',
  'party',
  'MYA Valencia, Avenida de Francia',
  NOW() + interval '3 days',
  400, 203,
  0, NULL,
  true, false,
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
  'published',
  '[]'::jsonb
),

(
  'Red Party — Erasmus Open Bar',
  'red-party-open-bar',
  'DRESS IN RED and get an extra free drink! Open bar from 23:30 to 03:30. International music, crazy atmosphere.',
  'party',
  'Caribbeans Aragon, Valencia',
  NOW() + interval '9 days',
  250, 89,
  5, NULL,
  false, false,
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
  'published',
  '[
    {"id":"open-bar","name":"Open Bar","price":5,"description":"3h open bar 23:30–03:30","seats":200,"members_only":false,"valid_until_time":null,"benefits":["3h open bar"],"min_group_size":null,"activates_after":null},
    {"id":"dress-in-red","name":"Dress in Red","price":5,"description":"Open bar + EXTRA FREE DRINK on arrival","seats":50,"members_only":false,"valid_until_time":null,"benefits":["3h open bar","Extra free drink"],"min_group_size":null,"activates_after":null}
  ]'::jsonb
),

(
  'Bachata Workshop + International Night',
  'bachata-workshop-night',
  'Learn Bachata from 22:00–23:00 with professional instructors, then party until 03:30! Perfect for beginners — no experience needed.',
  'cultural',
  'Magnifique Aragon, Valencia',
  NOW() + interval '4 days',
  150, 67,
  12, 8,
  false, false,
  'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800',
  'published',
  '[]'::jsonb
),

(
  'International Monday — Closing Night',
  'international-monday-closing',
  'The LAST International Monday of the semester! Free shot until midnight. International music from 23:00 to 03:30. The biggest closing party of the year!',
  'party',
  'Magnifique Aragon, Polo y Peyrolon 37',
  NOW() + interval '13 days',
  350, 201,
  5, NULL,
  false, true,
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
  'published',
  '[]'::jsonb
);

-- ── Trips ─────────────────────────────────────────────────────

INSERT INTO public.trips (
  title, slug, description, destination,
  start_date, end_date,
  capacity, seats_sold,
  price_standard, price_early_bird,
  early_bird_deadline, early_bird_seats, early_bird_seats_sold,
  price_group, group_min_size,
  image_url, status,
  whats_included, meeting_points
) VALUES

(
  'Cala Moraig — Hiking & Beach',
  'cala-moraig-hiking-beach',
  'One of the most stunning hidden beaches in Spain! Hike through dramatic cliffs, swim in crystal clear water and explore sea caves. Perfect day trip for nature lovers.',
  'Cala Moraig, Alicante',
  CURRENT_DATE + interval '7 days',
  CURRENT_DATE + interval '7 days',
  40, 18,
  25, 18,
  NOW() + interval '5 days', 20, 18,
  NULL, NULL,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'published',
  ARRAY['Transport from Valencia', 'Guide', 'Swimming stop'],
  ARRAY['Estación del Norte, Valencia — 8:00 AM']
),

(
  'Albufera Sunset Tour',
  'albufera-sunset-tour',
  'Discover the magical Albufera natural park just 30 minutes from Valencia. Boat ride on the lake, watch the most beautiful sunset in the region, traditional paella dinner included.',
  'Albufera Natural Park, Valencia',
  CURRENT_DATE + interval '5 days',
  CURRENT_DATE + interval '5 days',
  35, 22,
  35, 25,
  NOW() + interval '3 days', 15, 15,
  30, 4,
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'published',
  ARRAY['Transport', 'Boat ride', 'Sunset paella dinner', 'Guide'],
  ARRAY['Torres de Serranos, Valencia — 17:00']
),

(
  'Morocco Adventure — 9 Days',
  'morocco-adventure-9-days',
  'The most epic trip of your Erasmus! 9 days through Morocco — Marrakech, Sahara Desert, Fes, Chefchaouen and more. Everything included. Limited spots — sells out every time!',
  'Morocco',
  CURRENT_DATE + interval '21 days',
  CURRENT_DATE + interval '30 days',
  50, 31,
  299, 249,
  NOW() + interval '10 days', 20, 20,
  279, 4,
  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
  'published',
  ARRAY['Transport', 'All accommodation', 'Breakfast daily', 'Sahara camel ride', 'Professional guide', 'All activities'],
  ARRAY['Valencia Bus Station — 06:00 AM']
),

(
  'Ibiza Weekend Getaway',
  'ibiza-weekend-getaway',
  'The ultimate Erasmus weekend! 3 days in Ibiza — best clubs, crystal beaches, boat parties and non-stop good vibes. Ferry + accommodation included.',
  'Ibiza, Spain',
  CURRENT_DATE + interval '14 days',
  CURRENT_DATE + interval '16 days',
  60, 44,
  159, 129,
  NOW() + interval '7 days', 25, 25,
  145, 4,
  'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
  'published',
  ARRAY['Ferry Valencia–Ibiza', '2 nights accommodation', 'Welcome drink', 'Beach day'],
  ARRAY['Valencia Port — 08:00 AM']
),

(
  'Montanejos Natural Pools',
  'montanejos-natural-pools',
  'Hidden gem 1 hour from Valencia! Natural thermal pools, cliff jumping, river trekking and swimming in paradise. One of the best day trips from Valencia.',
  'Montanejos, Castellón',
  CURRENT_DATE + interval '8 days',
  CURRENT_DATE + interval '8 days',
  45, 12,
  22, 16,
  NOW() + interval '6 days', 20, 12,
  NULL, NULL,
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'published',
  ARRAY['Transport from Valencia', 'Guide', 'Free time at pools'],
  ARRAY['Estación del Norte, Valencia — 9:00 AM']
),

(
  'Tabarca Island — Boat Day',
  'tabarca-island-boat-day',
  'Spain''s only inhabited island! Crystal clear Mediterranean water, incredible snorkeling, fresh seafood lunch and a full day on the boat.',
  'Tabarca Island, Alicante',
  CURRENT_DATE + interval '11 days',
  CURRENT_DATE + interval '11 days',
  40, 27,
  45, 35,
  NOW() + interval '8 days', 15, 15,
  40, 4,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'published',
  ARRAY['Boat from Alicante', 'Snorkel equipment', 'Seafood lunch', 'Guide'],
  ARRAY['Alicante Port — 09:30 AM']
);

-- ── Verify ────────────────────────────────────────────────────

SELECT title, status, date::date AS event_date
FROM public.events
ORDER BY date ASC;

SELECT title, status, start_date
FROM public.trips
ORDER BY start_date ASC;
