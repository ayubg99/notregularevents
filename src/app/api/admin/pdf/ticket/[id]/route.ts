import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getAdminClient } from '@/lib/supabase/admin'
import TicketDocument from '@/lib/pdf/TicketDocument'
import type { PdfTicket } from '@/lib/pdf/TicketDocument'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const type    = req.nextUrl.searchParams.get('type') as 'event' | 'trip' | null
  const admin   = getAdminClient()

  let ticket: PdfTicket | null = null

  if (type === 'event') {
    const { data: t, error } = await admin
      .from('event_tickets')
      .select('booking_ref, qr_code, guest_name, events(title, date)')
      .eq('id', id)
      .single()

    if (error || !t) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const event = t.events as unknown as { title: string; date: string } | null
    ticket = {
      guestName:  t.guest_name ?? 'Member',
      title:      event?.title ?? 'Event',
      date:       event?.date  ?? '',
      tier:       null,
      bookingRef: t.booking_ref,
      qrCode:     t.qr_code ?? null,
      type:       'EVENT',
    }
  } else {
    const { data: b, error } = await admin
      .from('trip_bookings')
      .select('booking_ref, qr_code, guest_name, tier, trips(title, start_date, destination)')
      .eq('id', id)
      .single()

    if (error || !b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const trip = b.trips as unknown as { title: string; start_date: string; destination: string } | null
    ticket = {
      guestName:  b.guest_name ?? 'Member',
      title:      trip ? `${trip.title} — ${trip.destination}` : 'Trip',
      date:       trip?.start_date ?? '',
      tier:       b.tier ?? null,
      bookingRef: b.booking_ref,
      qrCode:     b.qr_code ?? null,
      type:       'TRIP',
    }
  }

  const element = React.createElement(TicketDocument, {
    tickets:  [ticket],
    docTitle: `Ticket — ${ticket.bookingRef}`,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${ticket.bookingRef}.pdf"`,
    },
  })
}
