'use server'

import { createClient } from '@/lib/supabase/server'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation } from '@/lib/email'
import type { TripTier } from '@/types/database'

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
        type:     'event',
        date:     event.date     ?? undefined,
        location: event.location ?? undefined,
      })
    }
    return { success: true, url: `${baseUrl}/booking/success?ref=${bookingRef}` }
  }

  return { success: false, error: 'Paid events must go through the checkout API.' }
}

// ─── Trip checkout (free path only; paid path → /api/stripe/create-checkout) ─

export async function createTripBooking(input: {
  tripId:      string
  tier:        TripTier
  slug:        string
  guestName?:  string
  guestEmail?: string
  guestPhone?: string
}): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from('trips')
    .select('id, title, price_early_bird, price_standard, price_vip, price_group, capacity, seats_sold, slug, image_url, start_date, destination, whatsapp_group_url')
    .eq('id', input.tripId)
    .eq('status', 'published')
    .single()

  if (!trip) {
    return { success: false, error: 'Trip not found or no longer available.' }
  }

  const seatsLeft = trip.capacity - trip.seats_sold
  if (seatsLeft < 1) {
    return { success: false, error: 'Sorry, this trip is fully booked.' }
  }

  const priceMap: Record<TripTier, number> = {
    early_bird: trip.price_early_bird ?? trip.price_standard,
    standard:   trip.price_standard,
    group:      trip.price_group      ?? trip.price_standard,
  }
  const price = priceMap[input.tier]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (price === 0) {
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)
    const { error } = await supabase.from('trip_bookings').insert({
      trip_id:           trip.id,
      user_id:           user?.id ?? null,
      tier:              input.tier,
      booking_ref:       bookingRef,
      qr_code:           qrCode,
      stripe_payment_id: null,
      guest_name:        input.guestName  ?? null,
      guest_email:       input.guestEmail ?? null,
      guest_phone:       input.guestPhone ?? null,
      status:            'confirmed' as const,
      deposit_paid:      true,
    })
    if (error) {
      console.error('[checkout free trip]', error.message)
      return { success: false, error: 'Failed to create your booking. Please try again.' }
    }
    const toEmail = input.guestEmail ?? user?.email
    const toName  = input.guestName  ?? user?.user_metadata?.full_name ?? 'there'
    if (toEmail) {
      await sendBookingConfirmation({
        to:          toEmail,
        name:        toName,
        bookingRef,
        qrCode,
        title:       trip.title,
        type:        'trip',
        date:        trip.start_date ?? undefined,
        location:    trip.destination ?? undefined,
        whatsappUrl: trip.whatsapp_group_url ?? undefined,
      })
    }
    return { success: true, url: `${baseUrl}/booking/success?ref=${bookingRef}` }
  }

  return { success: false, error: 'Paid trips must go through the checkout API.' }
}
