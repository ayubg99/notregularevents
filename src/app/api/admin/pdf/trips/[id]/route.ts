import { NextRequest, NextResponse } from'next/server'
import { renderToBuffer } from'@react-pdf/renderer'
import React from'react'
import { getAdminClient } from'@/lib/supabase/admin'
import TicketDocument from'@/lib/pdf/TicketDocument'
import type { PdfTicket } from'@/lib/pdf/TicketDocument'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = getAdminClient()

  const [{ data: trip, error: tripError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      admin.from('trips').select('title, start_date, destination').eq('id', id).single(),
      admin.from('trip_bookings')
        .select('id, booking_ref, qr_code, guest_name, tier, status')
        .eq('trip_id', id)
        .order('created_at', { ascending: true }),
    ])

  if (tripError || !trip) {
    return NextResponse.json({ error:'Trip not found' }, { status: 404 })
  }
  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 })
  }

  const pdfTickets: PdfTicket[] = (bookings ?? []).map(b => ({
    guestName: b.guest_name ??'Member',
    title:`${trip.title} — ${trip.destination}`,
    date: trip.start_date,
    tier: b.tier ?? null,
    bookingRef: b.booking_ref,
    qrCode: b.qr_code ?? null,
    type:'TRIP',
  }))

  const docTitle =`${trip.title} — Manifest`
  const element = React.createElement(TicketDocument, { tickets: pdfTickets, docTitle })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const slug = trip.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0, 40)
  return new Response(new Uint8Array(buffer), {
    headers: {
'Content-Type':'application/pdf',
'Content-Disposition':`attachment; filename="manifest-${slug}.pdf"`,
    },
  })
}
