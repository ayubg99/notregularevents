'use server'

import { createClient } from '@/lib/supabase/server'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation } from '@/lib/email'

type Result =
  | { success: true;  url: string }
  | { success: false; error: string }

// ─── Event checkout (free path only; paid path → /api/stripe/create-checkout) ─

export async function createCheckoutSession(input: {
  eventId:    string
  quantity:   number
  slug:       string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, price, capacity, tickets_sold, slug, image_url, date, location')
    .eq('id', input.eventId)
    .eq('status', 'published')
    .single()

  if (!event) {
    return { success: false, error: 'Event not found or no longer available.' }
  }

  const spotsLeft = event.capacity - event.tickets_sold
  if (spotsLeft < input.quantity) {
    return {
      success: false,
      error:   `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining.`,
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (event.price === 0) {
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)
    const tickets = Array.from({ length: input.quantity }, () => ({
      event_id:          event.id,
      user_id:           user?.id ?? null,
      booking_ref:       bookingRef,
      qr_code:           qrCode,
      stripe_payment_id: null,
      guest_name:        input.guestName  ?? null,
      guest_email:       input.guestEmail ?? null,
      guest_phone:       input.guestPhone ?? null,
      status:            'active' as const,
    }))
    const { error } = await supabase.from('event_tickets').insert(tickets)
    if (error) {
      console.error('[checkout free event]', error.message)
      return { success: false, error: 'Failed to create your ticket. Please try again.' }
    }
    const toEmail = input.guestEmail ?? user?.email
    const toName  = input.guestName  ?? user?.user_metadata?.full_name ?? 'there'
    if (toEmail) {
      await sendBookingConfirmation({
        to:       toEmail,
        name:     toName,
        bookingRef,
        qrCode,
        title:    event.title,
        date:     event.date     ?? undefined,
        location: event.location ?? undefined,
      })
    }
    return { success: true, url: `${baseUrl}/booking/success?ref=${bookingRef}` }
  }

  return { success: false, error: 'Paid events must go through the checkout API.' }
}
