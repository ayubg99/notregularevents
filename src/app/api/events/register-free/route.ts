import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getAdminClient } from '@/lib/supabase/admin'
import { generateQR } from '@/lib/qr'
import { sendBookingConfirmation, sendGroupBookingConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const { eventId, guestName, guestEmail, guestPhone, quantity = 1, attendees } = await req.json()

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

  const ticketAttendees: { name: string; email: string }[] =
    Array.isArray(attendees) && attendees.length > 0
      ? attendees
      : [{ name: guestName, email: guestEmail }]

  const allTickets: { name: string; bookingRef: string; qrCode: string }[] = []
  const groupRef = ticketAttendees.length > 1 ? nanoid(8).toUpperCase() : null

  for (let i = 0; i < ticketAttendees.length; i++) {
    const attendee       = ticketAttendees[i]
    const bookingRef     = nanoid(8).toUpperCase()
    const qrCodeDataUrl  = await generateQR(bookingRef)
    const recipientEmail = attendee.email?.trim() || guestEmail

    const { error: insertError } = await admin.from('event_tickets').insert({
      event_id:          eventId,
      user_id:           null,
      guest_name:        attendee.name || null,
      guest_email:       recipientEmail,
      guest_phone:       i === 0 ? (guestPhone ?? null) : null,
      booking_ref:       bookingRef,
      qr_code:           qrCodeDataUrl,
      status:            'active' as const,
      amount_paid:       0,
      stripe_payment_id: null,
      group_booking_ref: groupRef,
      is_group_booking:  ticketAttendees.length > 1,
      lead_name:         ticketAttendees.length > 1 ? guestName  : null,
      lead_email:        ticketAttendees.length > 1 ? guestEmail : null,
    })

    if (insertError) {
      console.error('[register-free] insert error:', insertError)
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    allTickets.push({ name: attendee.name, bookingRef, qrCode: qrCodeDataUrl })

    if (recipientEmail) {
      await sendBookingConfirmation({
        to:       recipientEmail,
        name:     attendee.name,
        bookingRef,
        qrCode:   qrCodeDataUrl,
        title:    event.title,
        type:     'event',
        date:     event.date     ?? undefined,
        location: event.location ?? undefined,
        isFree:   true,
      })
    }
  }

  // @ts-expect-error — RPC added via SQL; types regenerate after `supabase gen types`
  await admin.rpc('increment_tickets_sold', { p_event_id: eventId, p_quantity: ticketAttendees.length })

  if (ticketAttendees.length > 1) {
    await sendGroupBookingConfirmation({
      to:            guestEmail,
      leadName:      guestName,
      eventTitle:    event.title,
      eventDate:     event.date     ?? undefined,
      eventLocation: event.location ?? undefined,
      tickets:       allTickets,
      isFree:        true,
    })
  }

  return NextResponse.json({ success: true, bookingRef: allTickets[0]?.bookingRef })
}
