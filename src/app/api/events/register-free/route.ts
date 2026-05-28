import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getAdminClient } from '@/lib/supabase/admin'
import { generateQR } from '@/lib/qr'
import { sendBookingConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const { eventId, guestName, guestEmail, guestPhone, quantity = 1 } = await req.json()

  if (!eventId || !guestName || !guestEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getAdminClient()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('is_free', true)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found or not a free event' }, { status: 404 })
  }

  const remaining = event.capacity - event.tickets_sold
  if (remaining < quantity) {
    return NextResponse.json(
      { error: `Only ${remaining} spot${remaining === 1 ? '' : 's'} left` },
      { status: 400 },
    )
  }

  const bookingRef    = nanoid(8).toUpperCase()
  const qrCodeDataUrl = await generateQR(bookingRef)

  const { error: insertError } = await admin.from('event_tickets').insert({
    event_id:          eventId,
    user_id:           null,
    guest_name:        guestName,
    guest_email:       guestEmail,
    guest_phone:       guestPhone ?? null,
    booking_ref:       bookingRef,
    qr_code:           qrCodeDataUrl,
    status:            'active' as const,
    amount_paid:       0,
    stripe_payment_id: null,
  })

  if (insertError) {
    console.error('[register-free] insert error:', insertError)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }

  await admin
    .from('events')
    .update({ tickets_sold: event.tickets_sold + quantity })
    .eq('id', eventId)

  await sendBookingConfirmation({
    to:        guestEmail,
    name:      guestName,
    bookingRef,
    qrCode:    qrCodeDataUrl,
    title:     event.title,
    type:      'event',
    date:      event.date ?? undefined,
    location:  event.location ?? undefined,
    isFree:    true,
  })

  return NextResponse.json({ success: true, bookingRef, qrCode: qrCodeDataUrl })
}
