import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ROOM_PHOTO_SETS = [
  [
    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  ],
]

const PARTNER_ROOM_PHOTO_SETS = [
  [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  ],
]

export async function POST() {
  const supabase = getAdminClient()

  // ── 1. Student listings ───────────────────────────────────────

  const { data: listings, error: fetchListingsErr } = await supabase
    .from('housing_listings')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (fetchListingsErr) return NextResponse.json({ error: fetchListingsErr.message }, { status: 500 })

  for (let i = 0; i < (listings ?? []).length; i++) {
    const photos = ROOM_PHOTO_SETS[i % ROOM_PHOTO_SETS.length]
    const { error } = await supabase
      .from('housing_listings')
      .update({ photos })
      .eq('id', listings![i].id)
    if (error) return NextResponse.json({ error: `listing ${i}: ${error.message}` }, { status: 500 })
  }

  // ── 2. Partner rooms ──────────────────────────────────────────

  const { data: rooms, error: fetchRoomsErr } = await supabase
    .from('partner_rooms')
    .select('id')
    .order('created_at', { ascending: true })

  if (fetchRoomsErr) return NextResponse.json({ error: fetchRoomsErr.message }, { status: 500 })

  for (let i = 0; i < (rooms ?? []).length; i++) {
    const photos = PARTNER_ROOM_PHOTO_SETS[i % PARTNER_ROOM_PHOTO_SETS.length]
    const { error } = await supabase
      .from('partner_rooms')
      .update({ photos })
      .eq('id', rooms![i].id)
    if (error) return NextResponse.json({ error: `room ${i}: ${error.message}` }, { status: 500 })
  }

  // ── 3. Partner logos ──────────────────────────────────────────

  const PARTNER_LOGOS: Record<string, string> = {
    'Erasmus Rooms Valencia':   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    'Valencia Student Housing': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
  }

  for (const [name, logo_url] of Object.entries(PARTNER_LOGOS)) {
    const { error } = await supabase
      .from('housing_partners')
      .update({ logo_url })
      .eq('name', name)
    if (error) return NextResponse.json({ error: `partner ${name}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    listings_updated: listings?.length ?? 0,
    rooms_updated: rooms?.length ?? 0,
    partners_updated: Object.keys(PARTNER_LOGOS).length,
  })
}
