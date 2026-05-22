'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import type { TripTier } from '@/types/database'

type Result =
  | { success: true;  url: string }
  | { success: false; error: string }

// ─── Event checkout (free path only; paid path → /api/stripe/create-checkout) ─

export async function createCheckoutSession(input: {
  eventId:  string
  quantity: number
  slug:     string
}): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Please log in to book tickets.' }
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, title, price, capacity, tickets_sold, slug, image_url')
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

  // Free event — insert tickets directly
  if (event.price === 0) {
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)
    const tickets = Array.from({ length: input.quantity }, () => ({
      event_id:          event.id,
      user_id:           user.id,
      booking_ref:       bookingRef,
      qr_code:           qrCode,
      stripe_payment_id: null,
      status:            'active' as const,
    }))
    const { error } = await supabase.from('event_tickets').insert(tickets)
    if (error) {
      console.error('[checkout free event]', error.message)
      return { success: false, error: 'Failed to create your ticket. Please try again.' }
    }
    return { success: true, url: `${baseUrl}/booking/success?ref=${bookingRef}` }
  }

  // Paid event — create Stripe session
  try {
    const session = await stripe.checkout.sessions.create({
      mode:       'payment',
      line_items: [{
        quantity: input.quantity,
        price_data: {
          currency:     'eur',
          unit_amount:  Math.round(event.price * 100),
          product_data: {
            name:   event.title,
            images: event.image_url ? [event.image_url] : [],
          },
        },
      }],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/events/${event.slug}`,
      metadata: {
        type:     'event',
        item_id:  event.id,
        user_id:  user.id,
        quantity: String(input.quantity),
      },
    })

    if (!session.url) {
      return { success: false, error: 'Failed to create checkout session.' }
    }
    return { success: true, url: session.url }
  } catch (err) {
    console.error('[checkout stripe event]', err)
    return { success: false, error: 'Payment setup failed. Please try again.' }
  }
}

// ─── Trip checkout (free path only; paid path → /api/stripe/create-checkout) ─

export async function createTripBooking(input: {
  tripId: string
  tier:   TripTier
  slug:   string
}): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Please log in to book a trip.' }
  }

  const { data: trip } = await supabase
    .from('trips')
    .select('id, title, price_early_bird, price_standard, price_vip, price_group, capacity, seats_sold, slug, image_url')
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
    vip:        trip.price_vip        ?? trip.price_standard,
    group:      trip.price_group      ?? trip.price_standard,
  }
  const price = priceMap[input.tier]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Free trip
  if (price === 0) {
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)
    const { error } = await supabase.from('trip_bookings').insert({
      trip_id:           trip.id,
      user_id:           user.id,
      tier:              input.tier,
      booking_ref:       bookingRef,
      qr_code:           qrCode,
      stripe_payment_id: null,
      status:            'confirmed' as const,
      deposit_paid:      true,
    })
    if (error) {
      console.error('[checkout free trip]', error.message)
      return { success: false, error: 'Failed to create your booking. Please try again.' }
    }
    return { success: true, url: `${baseUrl}/booking/success?ref=${bookingRef}` }
  }

  // Paid trip — create Stripe session
  try {
    const session = await stripe.checkout.sessions.create({
      mode:       'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency:     'eur',
          unit_amount:  Math.round(price * 100),
          product_data: {
            name:   `${trip.title} — ${input.tier.replace('_', ' ')}`,
            images: trip.image_url ? [trip.image_url] : [],
          },
        },
      }],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/trips/${trip.slug}`,
      metadata: {
        type:    'trip',
        item_id: trip.id,
        user_id: user.id,
        tier:    input.tier,
      },
    })

    if (!session.url) {
      return { success: false, error: 'Failed to create checkout session.' }
    }
    return { success: true, url: session.url }
  } catch (err) {
    console.error('[checkout stripe trip]', err)
    return { success: false, error: 'Payment setup failed. Please try again.' }
  }
}
