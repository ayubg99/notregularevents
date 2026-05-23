import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getAdminClient } from '@/lib/supabase/admin'
import TicketDocument from '@/lib/pdf/TicketDocument'
import type { PdfTicket } from '@/lib/pdf/TicketDocument'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin   = getAdminClient()

  const [{ data: event, error: eventError }, { data: tickets, error: ticketsError }] =
    await Promise.all([
      admin.from('events').select('title, date, location').eq('id', id).single(),
      admin.from('event_tickets')
        .select('id, booking_ref, qr_code, guest_name, status')
        .eq('event_id', id)
        .order('created_at', { ascending: true }),
    ])

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 })
  }

  const pdfTickets: PdfTicket[] = (tickets ?? []).map(t => ({
    guestName:  t.guest_name ?? 'Member',
    title:      event.title,
    date:       event.date,
    tier:       null,
    bookingRef: t.booking_ref,
    qrCode:     t.qr_code ?? null,
    type:       'EVENT',
  }))

  const docTitle = `${event.title} — Attendees`
  const element  = React.createElement(TicketDocument, { tickets: pdfTickets, docTitle })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer   = await renderToBuffer(element as any)

  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="attendees-${slug}.pdf"`,
    },
  })
}
