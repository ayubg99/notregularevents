import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const now = new Date()
  const date = new Date(now.getTime() + 3 * 86400000).toISOString()

  const { error } = await supabase.from('events').insert({
    title:            'Espit Chupitos Night',
    slug:             'espit-chupitos-night',
    description:      'The most fun bar in Valencia! Espit Chupitos has over 500 different shots from around the world. A legendary night out for Erasmus students — the place everyone visits at least once during their semester.',
    category:         'party',
    location:         'Espit Chupitos, Calle Caballeros 41, El Carmen, Valencia',
    date,
    capacity:         200,
    tickets_sold:     0,
    price:            5,
    is_free:          false,
    members_only_free: false,
    status:           'published',
    image_url:        'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800',
    ticket_tiers: [
      {
        id: 'free-entry', name: 'Free Entry', price: 0,
        description: 'Free entry before 23:00 — members only',
        seats: 50, members_only: true, valid_until_time: '23:00',
        benefits: [], min_group_size: null, activates_after: null,
      },
      {
        id: 'guestlist', name: 'Guestlist', price: 5,
        description: 'Guaranteed entry + welcome shot',
        seats: 100, members_only: false, valid_until_time: null,
        benefits: ['Welcome shot'], min_group_size: null, activates_after: null,
      },
      {
        id: 'shot-package', name: 'Shot Package', price: 15,
        description: '5 shots of your choice + entry',
        seats: 50, members_only: false, valid_until_time: null,
        benefits: ['5 shots of your choice'], min_group_size: null, activates_after: null,
      },
    ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, event: 'espit-chupitos-night' })
}
