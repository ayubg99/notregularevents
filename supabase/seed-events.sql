-- =================================================================
-- NOT REGULAR EVENTS — Event Seed Data (Block 2 of 2)
-- Run this AFTER setup-full.sql has completed successfully.
-- These events use enum values added in Block 1.
-- =================================================================

INSERT INTO public.events (
  title, slug, description, category, city,
  location, date, capacity, tickets_sold,
  price, is_free, members_only_free,
  image_url, status, ticket_tiers
) VALUES

-- 1. Football screening (Madrid)
(
  'Champions League Final — Watch Party',
  'champions-league-final-watch-party',
  'Watch the biggest match of the year on a massive screen. Free drinks for the first 30 people. Dress in your team colours and join 300+ football fans from across Europe.',
  'football_screening',
  'Madrid',
  'Estadio Bar Rooftop, Gran Vía 28, Madrid',
  NOW() + INTERVAL '8 days',
  300, 0,
  10.00, false, false,
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
  'published',
  '[
    {"id":"general","name":"General Admission","price":10,"description":"Entry + 1 welcome drink","seats":200,"members_only":false,"valid_until_time":null,"benefits":["Welcome drink","Standing area"],"min_group_size":null,"activates_after":null},
    {"id":"vip-sofa","name":"VIP Sofa Seat","price":30,"description":"Reserved sofa area + bottle of beer","seats":50,"members_only":false,"valid_until_time":null,"benefits":["Reserved seat","Bottle of beer","Best view"],"min_group_size":2,"activates_after":null},
    {"id":"members","name":"Members Price","price":7,"description":"Member discount — 1 welcome drink included","seats":50,"members_only":true,"valid_until_time":null,"benefits":["Welcome drink","Standing area","Member price"],"min_group_size":null,"activates_after":null}
  ]'::jsonb
),

-- 2. Club night (Madrid)
(
  'NRE x Fabrik — International Club Night',
  'nre-fabrik-international-club-night',
  'The biggest international party in Madrid. 3 floors, 4 DJs, 2000+ people. This is the night everyone talks about. Guestlist closes at midnight — don''t miss it.',
  'club_night',
  'Madrid',
  'Fabrik Club, Ctra. de Fuenlabrada, Madrid',
  NOW() + INTERVAL '3 days',
  500, 180,
  15.00, false, false,
  'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800',
  'published',
  '[
    {"id":"guestlist","name":"Guestlist","price":15,"description":"Priority entry before 01:00 + welcome shot","seats":300,"members_only":false,"valid_until_time":"01:00","benefits":["Priority entry","Welcome shot"],"min_group_size":null,"activates_after":null},
    {"id":"vip-table","name":"VIP Table","price":200,"description":"Private table for 6 + 2 bottles. Best area in the club","seats":10,"members_only":false,"valid_until_time":null,"benefits":["Private table for 6","2 bottles included","VIP host","Best area"],"min_group_size":6,"activates_after":null},
    {"id":"members-guestlist","name":"Members Guestlist","price":10,"description":"Members get €5 off guestlist + welcome shot","seats":80,"members_only":true,"valid_until_time":"01:00","benefits":["Priority entry","Welcome shot","Member price"],"min_group_size":null,"activates_after":null},
    {"id":"door","name":"Door Price","price":25,"description":"Entry after guestlist closes","seats":100,"members_only":false,"valid_until_time":null,"benefits":[],"min_group_size":null,"activates_after":"guestlist"}
  ]'::jsonb
),

-- 3. Artist Night (Marbella)
(
  'Maluma After-Party — Puerto Banús',
  'maluma-after-party-puerto-banus',
  'Official after-party of the Maluma Marbella concert. Exclusive villa venue in Puerto Banús. Limited to 200 guests — this will sell out.',
  'artist_night',
  'Marbella',
  'Villa Pacha, Puerto Banús, Marbella',
  NOW() + INTERVAL '5 days',
  200, 120,
  35.00, false, false,
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  'published',
  '[
    {"id":"general","name":"General","price":35,"description":"Entry to the after-party","seats":120,"members_only":false,"valid_until_time":null,"benefits":["Entry","Welcome cocktail"],"min_group_size":null,"activates_after":null},
    {"id":"vip","name":"VIP Table","price":350,"description":"Private pool table for 8 + 2 bottles","seats":10,"members_only":false,"valid_until_time":null,"benefits":["Pool table for 8","2 bottles","VIP wristband","Meet & greet possible"],"min_group_size":8,"activates_after":null}
  ]'::jsonb
),

-- 4. Club Night (Marbella)
(
  'Ocean Club White Party — Marbella',
  'ocean-club-white-party-marbella',
  'All-white dress code. Open-air beach club. 3 pools, 2 stages, resident DJs + special guest. The most iconic summer party on the Costa del Sol.',
  'club_night',
  'Marbella',
  'Ocean Club Marbella, Avenida Lola Flores',
  NOW() + INTERVAL '11 days',
  600, 210,
  25.00, false, false,
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
  'published',
  '[
    {"id":"day-pass","name":"Day Pass","price":25,"description":"Full day access 12:00–20:00","seats":300,"members_only":false,"valid_until_time":"20:00","benefits":["Pool access","Sunbed (first come)","Welcome cocktail"],"min_group_size":null,"activates_after":null},
    {"id":"night-entry","name":"Night Entry","price":30,"description":"Evening entry from 20:00","seats":200,"members_only":false,"valid_until_time":null,"benefits":["Evening entry","Welcome cocktail","Dance floor access"],"min_group_size":null,"activates_after":null},
    {"id":"vip-cabana","name":"VIP Cabana","price":500,"description":"Private cabana for 6 — full day + night","seats":10,"members_only":false,"valid_until_time":null,"benefits":["Private cabana","Sunbeds","Bottle service","Butler"],"min_group_size":6,"activates_after":null}
  ]'::jsonb
),

-- 5. Football Screening (Madrid)
(
  'Euros Spain vs Germany — Live Viewing',
  'euros-spain-germany-live-viewing',
  'Spain vs Germany! Watch live with the craziest international crowd in Madrid. Giant 4K screen, Spanish bar snacks, and pure atmosphere. Arrive early — this always fills up.',
  'football_screening',
  'Madrid',
  'Mad Hoops Bar, Calle Fuencarral 44, Madrid',
  NOW() + INTERVAL '14 days',
  150, 0,
  5.00, false, false,
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  'published',
  '[
    {"id":"entry","name":"Guaranteed Entry","price":5,"description":"Reserve your spot — free entry not guaranteed","seats":100,"members_only":false,"valid_until_time":null,"benefits":["Guaranteed entry","Standing area"],"min_group_size":null,"activates_after":null},
    {"id":"vip-booth","name":"Booth Seat","price":20,"description":"Reserved booth seat + 1 jug of beer","seats":20,"members_only":false,"valid_until_time":null,"benefits":["Reserved seat","1 jug of beer"],"min_group_size":4,"activates_after":null},
    {"id":"free-entry","name":"Free Entry","price":0,"description":"Free entry for members — arrive before kick-off","seats":30,"members_only":true,"valid_until_time":null,"benefits":["Free entry","Member perk"],"min_group_size":null,"activates_after":null}
  ]'::jsonb
),

-- 6. Artist Night (Madrid)
(
  'Bad Bunny Secret Set — La Riviera',
  'bad-bunny-secret-set-la-riviera',
  'Rumoured secret set by a global reggaeton artist at La Riviera Madrid. This is NOT a confirmed lineup — it''s an intimate club night with a surprise headliner. 400 tickets only.',
  'artist_night',
  'Madrid',
  'La Riviera, Paseo Bajo de la Virgen del Puerto, Madrid',
  NOW() + INTERVAL '20 days',
  400, 0,
  45.00, false, false,
  'https://images.unsplash.com/photo-1501386761578-eaa54b915a8d?w=800',
  'published',
  '[
    {"id":"early-bird","name":"Early Bird","price":45,"description":"Limited early bird tickets — first 100","seats":100,"members_only":false,"valid_until_time":null,"benefits":["Entry","Early bird price"],"min_group_size":null,"activates_after":null},
    {"id":"standard","name":"Standard","price":60,"description":"Standard entry once early bird sells out","seats":250,"members_only":false,"valid_until_time":null,"benefits":["Entry"],"min_group_size":null,"activates_after":"early-bird"},
    {"id":"vip-table","name":"VIP Table","price":400,"description":"Reserved table for 4 + 1 bottle","seats":10,"members_only":false,"valid_until_time":null,"benefits":["Table for 4","1 bottle","VIP area"],"min_group_size":4,"activates_after":null},
    {"id":"members-early","name":"Members Early Bird","price":38,"description":"Members get extra €7 off early bird","seats":40,"members_only":true,"valid_until_time":null,"benefits":["Entry","Best member price"],"min_group_size":null,"activates_after":null}
  ]'::jsonb
);

-- ── Verify ───────────────────────────────────────────────────────

SELECT title, category, city, date::date AS event_date, capacity, price
FROM public.events
ORDER BY date ASC;
