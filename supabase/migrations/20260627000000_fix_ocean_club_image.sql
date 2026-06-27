-- Fix broken image_url for Ocean Club White Party event.
-- Old URL (photo-1571266028243-e4733b0f0bb0) returns 404.
UPDATE events
SET image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop'
WHERE slug = 'ocean-club-white-party-marbella';
