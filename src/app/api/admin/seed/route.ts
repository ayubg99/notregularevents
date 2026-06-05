import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  // ── Events ──────────────────────────────────────────────────

  const now = new Date()
  const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()
  const date = (days: number) => {
    const d2 = new Date(now)
    d2.setDate(d2.getDate() + days)
    return d2.toISOString().split('T')[0]
  }

  const events = [
    {
      title: 'International Monday — Akuarela Beach',
      slug: 'international-monday-akuarela',
      description: 'The biggest international Monday night in Valencia! Free entry before 1am. Dance on the beach terrace with international music all night. Meet students from 50+ countries.',
      category: 'party' as const,
      location: 'Akuarela Beach Club, Playa de la Malvarrosa',
      date: d(6),
      capacity: 300, tickets_sold: 187,
      price: 5, price_early_bird: null,
      is_free: false, members_only_free: false,
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      status: 'published' as const,
      ticket_tiers: [
        { id: 'free-entry', name: 'Free Entry', price: 0, description: 'Valid before 01:00 — members only', seats: 100, members_only: true, valid_until_time: '01:00', benefits: [], min_group_size: null, activates_after: null },
        { id: 'guestlist', name: 'Guestlist', price: 5, description: 'Guaranteed entry + welcome drink', seats: 150, members_only: false, valid_until_time: null, benefits: ['Welcome drink'], min_group_size: null, activates_after: null },
        { id: 'vip-table', name: 'VIP Table', price: 50, description: 'Private table + bottle service (min 4)', seats: 10, members_only: false, valid_until_time: null, benefits: ['Private table', 'Bottle service'], min_group_size: 4, activates_after: null },
        { id: 'door-price', name: 'Door Price', price: 15, description: 'Entry after guestlist closes', seats: 50, members_only: false, valid_until_time: null, benefits: [], min_group_size: null, activates_after: 'guestlist' },
      ],
    },
    {
      title: 'Beer Pong Tournament — Beracay Club',
      slug: 'beerpong-tuesday-beracay',
      description: 'Join the most fun Tuesday night in Valencia! Beer Pong tournament from 11pm. WIN A FREE TRIP for the winning team! Free entrance included.',
      category: 'party' as const,
      location: 'Beracay Club, Valencia',
      date: d(2),
      capacity: 200, tickets_sold: 134,
      price: 8, price_early_bird: null,
      is_free: false, members_only_free: false,
      image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      status: 'published' as const,
      ticket_tiers: [
        { id: 'free-entry', name: 'Free Entry', price: 0, description: 'Free entrance — first come first served', seats: 100, members_only: false, valid_until_time: '23:30', benefits: [], min_group_size: null, activates_after: null },
        { id: 'beer-pong-team', name: 'Beer Pong Team', price: 8, description: '2-3 people per team. WIN A FREE TRIP!', seats: 50, members_only: false, valid_until_time: null, benefits: ['Tournament entry', 'Chance to win free trip'], min_group_size: 2, activates_after: null },
        { id: 'members-price', name: 'Members Price', price: 6, description: 'Members price — Beer Pong team entry', seats: 20, members_only: true, valid_until_time: null, benefits: ['Tournament entry', 'Member discount'], min_group_size: 2, activates_after: null },
      ],
    },
    {
      title: 'International Wednesday — MYA Club',
      slug: 'international-wednesday-mya',
      description: 'FREE ENTRANCE all night at MYA Valencia. Open until 7AM. International music, best crowd in Valencia every Wednesday night. The midweek party you cannot miss.',
      category: 'party' as const,
      location: 'MYA Valencia, Avenida de Francia',
      date: d(3),
      capacity: 400, tickets_sold: 203,
      price: 0, price_early_bird: null,
      is_free: true, members_only_free: false,
      image_url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
      status: 'published' as const,
      ticket_tiers: [],
    },
    {
      title: 'Red Party — Erasmus Open Bar',
      slug: 'red-party-open-bar',
      description: 'DRESS IN RED and get an extra free drink! Open bar from 23:30 to 03:30. International music, crazy atmosphere.',
      category: 'party' as const,
      location: 'Caribbeans Aragon, Valencia',
      date: d(9),
      capacity: 250, tickets_sold: 89,
      price: 5, price_early_bird: null,
      is_free: false, members_only_free: false,
      image_url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
      status: 'published' as const,
      ticket_tiers: [
        { id: 'open-bar', name: 'Open Bar', price: 5, description: '3h open bar 23:30–03:30', seats: 200, members_only: false, valid_until_time: null, benefits: ['3h open bar'], min_group_size: null, activates_after: null },
        { id: 'dress-in-red', name: 'Dress in Red', price: 5, description: 'Open bar + EXTRA FREE DRINK on arrival', seats: 50, members_only: false, valid_until_time: null, benefits: ['3h open bar', 'Extra free drink'], min_group_size: null, activates_after: null },
      ],
    },
    {
      title: 'Bachata Workshop + International Night',
      slug: 'bachata-workshop-night',
      description: 'Learn Bachata from 22:00–23:00 with professional instructors, then party until 03:30! Perfect for beginners — no experience needed.',
      category: 'cultural' as const,
      location: 'Magnifique Aragon, Valencia',
      date: d(4),
      capacity: 150, tickets_sold: 67,
      price: 12, price_early_bird: 8,
      is_free: false, members_only_free: false,
      image_url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800',
      status: 'published' as const,
      ticket_tiers: [],
    },
    {
      title: 'International Monday — Closing Night',
      slug: 'international-monday-closing',
      description: 'The LAST International Monday of the semester! Free shot until midnight. International music from 23:00 to 03:30. The biggest closing party of the year!',
      category: 'party' as const,
      location: 'Magnifique Aragon, Polo y Peyrolon 37',
      date: d(13),
      capacity: 350, tickets_sold: 201,
      price: 5, price_early_bird: null,
      is_free: false, members_only_free: true,
      image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      status: 'published' as const,
      ticket_tiers: [],
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: eventsError } = await supabase.from('events').insert(events as any)
  if (eventsError) return NextResponse.json({ error: 'events: ' + eventsError.message }, { status: 500 })

  // ── Trips ────────────────────────────────────────────────────

  const trips = [
    {
      title: 'Cala Moraig — Hiking & Beach',
      slug: 'cala-moraig-hiking-beach',
      description: 'One of the most stunning hidden beaches in Spain! Hike through dramatic cliffs, swim in crystal clear water and explore sea caves. Perfect day trip for nature lovers.',
      destination: 'Cala Moraig, Alicante',
      start_date: date(7), end_date: date(7),
      capacity: 40, seats_sold: 18,
      price_standard: 25, price_early_bird: 18,
      early_bird_deadline: d(5), early_bird_seats: 20, early_bird_seats_sold: 18,
      price_group: null, group_min_size: null,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      status: 'published' as const,
      whats_included: ['Transport from Valencia', 'Guide', 'Swimming stop'],
      meeting_points: ['Estación del Norte, Valencia — 8:00 AM'],
    },
    {
      title: 'Albufera Sunset Tour',
      slug: 'albufera-sunset-tour',
      description: 'Discover the magical Albufera natural park just 30 minutes from Valencia. Boat ride on the lake, watch the most beautiful sunset in the region, traditional paella dinner included.',
      destination: 'Albufera Natural Park, Valencia',
      start_date: date(5), end_date: date(5),
      capacity: 35, seats_sold: 22,
      price_standard: 35, price_early_bird: 25,
      early_bird_deadline: d(3), early_bird_seats: 15, early_bird_seats_sold: 15,
      price_group: 30, group_min_size: 4,
      image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      status: 'published' as const,
      whats_included: ['Transport', 'Boat ride', 'Sunset paella dinner', 'Guide'],
      meeting_points: ['Torres de Serranos, Valencia — 17:00'],
    },
    {
      title: 'Morocco Adventure — 9 Days',
      slug: 'morocco-adventure-9-days',
      description: 'The most epic trip of your Erasmus! 9 days through Morocco — Marrakech, Sahara Desert, Fes, Chefchaouen and more. Everything included. Limited spots — sells out every time!',
      destination: 'Morocco',
      start_date: date(21), end_date: date(30),
      capacity: 50, seats_sold: 31,
      price_standard: 299, price_early_bird: 249,
      early_bird_deadline: d(10), early_bird_seats: 20, early_bird_seats_sold: 20,
      price_group: 279, group_min_size: 4,
      image_url: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
      status: 'published' as const,
      whats_included: ['Transport', 'All accommodation', 'Breakfast daily', 'Sahara camel ride', 'Professional guide', 'All activities'],
      meeting_points: ['Valencia Bus Station — 06:00 AM'],
    },
    {
      title: 'Ibiza Weekend Getaway',
      slug: 'ibiza-weekend-getaway',
      description: 'The ultimate Erasmus weekend! 3 days in Ibiza — best clubs, crystal beaches, boat parties and non-stop good vibes. Ferry + accommodation included.',
      destination: 'Ibiza, Spain',
      start_date: date(14), end_date: date(16),
      capacity: 60, seats_sold: 44,
      price_standard: 159, price_early_bird: 129,
      early_bird_deadline: d(7), early_bird_seats: 25, early_bird_seats_sold: 25,
      price_group: 145, group_min_size: 4,
      image_url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
      status: 'published' as const,
      whats_included: ['Ferry Valencia–Ibiza', '2 nights accommodation', 'Welcome drink', 'Beach day'],
      meeting_points: ['Valencia Port — 08:00 AM'],
    },
    {
      title: 'Montanejos Natural Pools',
      slug: 'montanejos-natural-pools',
      description: 'Hidden gem 1 hour from Valencia! Natural thermal pools, cliff jumping, river trekking and swimming in paradise. One of the best day trips from Valencia.',
      destination: 'Montanejos, Castellón',
      start_date: date(8), end_date: date(8),
      capacity: 45, seats_sold: 12,
      price_standard: 22, price_early_bird: 16,
      early_bird_deadline: d(6), early_bird_seats: 20, early_bird_seats_sold: 12,
      price_group: null, group_min_size: null,
      image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      status: 'published' as const,
      whats_included: ['Transport from Valencia', 'Guide', 'Free time at pools'],
      meeting_points: ['Estación del Norte, Valencia — 9:00 AM'],
    },
    {
      title: 'Tabarca Island — Boat Day',
      slug: 'tabarca-island-boat-day',
      description: "Spain's only inhabited island! Crystal clear Mediterranean water, incredible snorkeling, fresh seafood lunch and a full day on the boat.",
      destination: 'Tabarca Island, Alicante',
      start_date: date(11), end_date: date(11),
      capacity: 40, seats_sold: 27,
      price_standard: 45, price_early_bird: 35,
      early_bird_deadline: d(8), early_bird_seats: 15, early_bird_seats_sold: 15,
      price_group: 40, group_min_size: 4,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      status: 'published' as const,
      whats_included: ['Boat from Alicante', 'Snorkel equipment', 'Seafood lunch', 'Guide'],
      meeting_points: ['Alicante Port — 09:30 AM'],
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: tripsError } = await supabase.from('trips').insert(trips as any)
  if (tripsError) return NextResponse.json({ error: 'trips: ' + tripsError.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    inserted: { events: events.length, trips: trips.length },
  })
}
