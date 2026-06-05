import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const eventUpdates = [
    { slug: 'international-monday-akuarela', image_url: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800' },
    { slug: 'beerpong-tuesday-beracay',       image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
    { slug: 'international-wednesday-mya',    image_url: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800' },
    { slug: 'red-party-open-bar',             image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' },
    { slug: 'bachata-workshop-night',         image_url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800' },
    { slug: 'international-monday-closing',   image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
  ]

  const tripUpdates = [
    { slug: 'cala-moraig-hiking-beach',   image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800' },
    { slug: 'albufera-sunset-tour',        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { slug: 'morocco-adventure-9-days',    image_url: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800' },
    { slug: 'ibiza-weekend-getaway',       image_url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800' },
    { slug: 'montanejos-natural-pools',    image_url: 'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=800' },
    { slug: 'tabarca-island-boat-day',     image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800' },
  ]

  for (const { slug, image_url } of eventUpdates) {
    const { error } = await supabase.from('events').update({ image_url }).eq('slug', slug)
    if (error) return NextResponse.json({ error: `event ${slug}: ${error.message}` }, { status: 500 })
  }

  for (const { slug, image_url } of tripUpdates) {
    const { error } = await supabase.from('trips').update({ image_url }).eq('slug', slug)
    if (error) return NextResponse.json({ error: `trip ${slug}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: { events: eventUpdates.length, trips: tripUpdates.length } })
}
