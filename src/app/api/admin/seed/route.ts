import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  // ── Events ──────────────────────────────────────────────────

  const now = new Date()
  const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()

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

  return NextResponse.json({
    ok: true,
    inserted: { events: events.length },
  })
}
