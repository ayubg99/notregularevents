import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { nanoid } from 'nanoid'
import type { Database, PartnerRoomRow } from '@/types/database'

export const runtime = 'nodejs'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  const {
    roomId,
    guestName,
    guestEmail,
    guestPhone,
    nationality,
    university,
    moveInDate,
    duration,
    message,
  } = await req.json()

  if (!roomId || !guestName || !guestEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getAdminClient()

  const { data: room, error: roomErr } = await admin
    .from('partner_rooms')
    .select('*, housing_partners(*)')
    .eq('id', roomId)
    .single() as unknown as { data: PartnerRoomRow | null; error: { message: string } | null }

  if (roomErr || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.status !== 'available') {
    return NextResponse.json({ error: 'Room is no longer available' }, { status: 400 })
  }

  const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmuslifevalencia.com'
  const bookingRef = nanoid(8).toUpperCase()
  const partner   = room.housing_partners as (typeof room.housing_partners & Record<string, string>) | null

  const session = await stripe.checkout.sessions.create({
    mode:           'payment',
    customer_email: guestEmail,
    line_items: [{
      quantity:   1,
      price_data: {
        currency:     'eur',
        product_data: {
          name:        `Room contact — ${room.title}`,
          description: `${room.neighborhood} · €${room.monthly_rent}/month · Verified by Erasmus Life`,
        },
        unit_amount: Math.round((room.platform_fee ?? 50) * 100),
      },
    }],
    metadata: {
      type:              'room_contact',
      booking_ref:       bookingRef,
      room_id:           roomId,
      room_title:        room.title,
      partner_id:        room.partner_id,
      partner_name:      partner?.name        ?? '',
      partner_whatsapp:  partner?.whatsapp    ?? '',
      partner_email:     partner?.contact_email ?? '',
      partner_phone:     partner?.contact_phone ?? '',
      partner_contact_name: partner?.contact_name ?? '',
      neighborhood:      room.neighborhood,
      monthly_rent:      String(room.monthly_rent),
      deposit_amount:    String(room.deposit_amount),
      guest_name:        guestName,
      guest_email:       guestEmail,
      guest_phone:       guestPhone   ?? '',
      guest_nationality: nationality  ?? '',
      university:        university   ?? '',
      move_in_date:      moveInDate   ?? '',
      duration:          String(duration ?? 1),
      message:           message      ?? '',
    },
    success_url: `${baseUrl}/housing/contact-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/housing/rooms/${roomId}`,
  })

  return NextResponse.json({ url: session.url })
}
