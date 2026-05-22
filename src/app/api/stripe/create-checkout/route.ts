import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation } from '@/lib/email'
import type { MembershipPlan, TripTier } from '@/types/database'

type CheckoutType = 'event' | 'trip' | 'membership'

interface Body {
  type:        CheckoutType
  itemId:      string
  tier?:       TripTier
  quantity?:   number
  promoCode?:  string
  guestName?:  string
  guestEmail?: string
  guestPhone?: string
}

function applyDiscount(price: number, type: 'percentage' | 'fixed', value: number): number {
  const discounted = type === 'percentage'
    ? price * (1 - value / 100)
    : price - value
  return Math.max(0, discounted)
}

const MEMBERSHIP_PRICES: Record<MembershipPlan, string | undefined> = {
  basic:   process.env.STRIPE_PRICE_BASIC,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  vip:     process.env.STRIPE_PRICE_VIP,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body: Body = await request.json()
  const { type, itemId, tier, quantity = 1, promoCode, guestName, guestEmail, guestPhone } = body

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Membership still requires auth
  if (type === 'membership' && !user) {
    return NextResponse.json({ error: 'Please log in to purchase a membership.' }, { status: 401 })
  }

  // Membership discount: status=active AND (end_date is null OR end_date > now)
  let memberDiscount = false
  if (user) {
    const now = new Date().toISOString()
    const { data: mem } = await supabase
      .from('memberships')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gt.${now}`)
      .maybeSingle()
    memberDiscount = !!mem
  }

  // ── Validate promo code ──────────────────────────────────────
  let promoCodeId: string | undefined
  let discountType: 'percentage' | 'fixed' | undefined
  let discountValue = 0

  if (promoCode) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', promoCode)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .or('uses_remaining.is.null,uses_remaining.gt.0')
      .single()

    if (promo) {
      promoCodeId = promo.id
      discountType = promo.discount_type
      discountValue = promo.discount_value
    }
  }

  // ── Event checkout ───────────────────────────────────────────
  if (type === 'event') {
    const { data: event } = await supabase
      .from('events')
      .select('id, title, price, capacity, tickets_sold, slug, image_url, date, location')
      .eq('id', itemId)
      .eq('status', 'published')
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found or no longer available.' }, { status: 404 })
    }

    const spotsLeft = event.capacity - event.tickets_sold
    if (spotsLeft < quantity) {
      return NextResponse.json({ error: `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining.` }, { status: 409 })
    }

    let unitPrice = discountType
      ? applyDiscount(event.price, discountType, discountValue)
      : event.price
    if (memberDiscount) {
      unitPrice = applyDiscount(unitPrice, 'percentage', 15)
    }

    const cancelUrl = `${baseUrl}/events/${event.slug}`
    const toEmail = guestEmail ?? user?.email
    const toName  = guestName  ?? user?.user_metadata?.full_name ?? 'there'

    // Free path — insert directly
    if (unitPrice === 0) {
      const bookingRef = nanoid(8).toUpperCase()
      const qrCode = await generateQR(bookingRef)
      const tickets = Array.from({ length: quantity }, () => ({
        event_id:          event.id,
        user_id:           user?.id ?? null,
        booking_ref:       bookingRef,
        qr_code:           qrCode,
        stripe_payment_id: null,
        guest_name:        guestName  ?? null,
        guest_email:       guestEmail ?? null,
        guest_phone:       guestPhone ?? null,
        status:            'active' as const,
      }))
      const { error } = await supabase.from('event_tickets').insert(tickets)
      if (error) {
        console.error('[create-checkout free event]', error.message)
        return NextResponse.json({ error: 'Failed to create your ticket.' }, { status: 500 })
      }
      if (user?.id) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type:    'booking_confirmed',
          message: `Your ticket for ${event.title} is confirmed. Ref: ${bookingRef}`,
          read:    false,
        })
      }
      if (toEmail) {
        await sendBookingConfirmation({
          to:         toEmail,
          name:       toName,
          bookingRef,
          qrCode,
          title:      event.title,
          type:       'event',
          date:       event.date ?? undefined,
          location:   event.location ?? undefined,
        })
      }
      return NextResponse.json({ url: `${baseUrl}/booking/success?ref=${bookingRef}` })
    }

    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      customer_email: toEmail ?? undefined,
      line_items: [{
        quantity,
        price_data: {
          currency:     'eur',
          unit_amount:  Math.round(unitPrice * 100),
          product_data: {
            name:   event.title,
            images: event.image_url ? [event.image_url] : [],
          },
        },
      }],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl,
      metadata: {
        type:        'event',
        item_id:     event.id,
        user_id:     user?.id     ?? '',
        quantity:    String(quantity),
        guest_name:  guestName    ?? '',
        guest_email: guestEmail   ?? '',
        guest_phone: guestPhone   ?? '',
        event_date:  event.date   ?? '',
        location:    event.location ?? '',
        ...(promoCodeId ? { promo_code_id: promoCodeId } : {}),
      },
    })

    return NextResponse.json({ url: session.url })
  }

  // ── Trip checkout ────────────────────────────────────────────
  if (type === 'trip') {
    const tripTier = tier ?? 'standard'

    const { data: trip } = await supabase
      .from('trips')
      .select('id, title, price_early_bird, price_standard, price_vip, price_group, capacity, seats_sold, slug, image_url, start_date, destination, whatsapp_group_url')
      .eq('id', itemId)
      .eq('status', 'published')
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or no longer available.' }, { status: 404 })
    }

    const seatsLeft = trip.capacity - trip.seats_sold
    if (seatsLeft < 1) {
      return NextResponse.json({ error: 'Sorry, this trip is fully booked.' }, { status: 409 })
    }

    const tierPrices: Record<TripTier, number> = {
      early_bird: trip.price_early_bird ?? trip.price_standard,
      standard:   trip.price_standard,
      vip:        trip.price_vip        ?? trip.price_standard,
      group:      trip.price_group      ?? trip.price_standard,
    }
    const basePrice = tierPrices[tripTier]
    let unitPrice = discountType
      ? applyDiscount(basePrice, discountType, discountValue)
      : basePrice
    if (memberDiscount) {
      unitPrice = applyDiscount(unitPrice, 'percentage', 15)
    }

    const cancelUrl = `${baseUrl}/trips/${trip.slug}`
    const toEmail = guestEmail ?? user?.email
    const toName  = guestName  ?? user?.user_metadata?.full_name ?? 'there'

    // Free path
    if (unitPrice === 0) {
      const bookingRef = nanoid(8).toUpperCase()
      const qrCode = await generateQR(bookingRef)
      const { error } = await supabase.from('trip_bookings').insert({
        trip_id:           trip.id,
        user_id:           user?.id ?? null,
        tier:              tripTier,
        booking_ref:       bookingRef,
        qr_code:           qrCode,
        stripe_payment_id: null,
        guest_name:        guestName  ?? null,
        guest_email:       guestEmail ?? null,
        guest_phone:       guestPhone ?? null,
        status:            'confirmed' as const,
        deposit_paid:      true,
      })
      if (error) {
        console.error('[create-checkout free trip]', error.message)
        return NextResponse.json({ error: 'Failed to create your booking.' }, { status: 500 })
      }
      if (user?.id) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type:    'booking_confirmed',
          message: `Your booking for ${trip.title} is confirmed. Ref: ${bookingRef}`,
          read:    false,
        })
      }
      if (toEmail) {
        await sendBookingConfirmation({
          to:           toEmail,
          name:         toName,
          bookingRef,
          qrCode,
          title:        trip.title,
          type:         'trip',
          date:         trip.start_date ?? undefined,
          location:     trip.destination ?? undefined,
          whatsappUrl:  trip.whatsapp_group_url ?? undefined,
        })
      }
      return NextResponse.json({ url: `${baseUrl}/booking/success?ref=${bookingRef}` })
    }

    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      customer_email: toEmail ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency:     'eur',
          unit_amount:  Math.round(unitPrice * 100),
          product_data: {
            name:   `${trip.title} — ${tripTier.replace('_', ' ')}`,
            images: trip.image_url ? [trip.image_url] : [],
          },
        },
      }],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl,
      metadata: {
        type:              'trip',
        item_id:           trip.id,
        user_id:           user?.id       ?? '',
        tier:              tripTier,
        guest_name:        guestName      ?? '',
        guest_email:       guestEmail     ?? '',
        guest_phone:       guestPhone     ?? '',
        trip_date:         trip.start_date ?? '',
        destination:       trip.destination ?? '',
        whatsapp_group_url: trip.whatsapp_group_url ?? '',
        ...(promoCodeId ? { promo_code_id: promoCodeId } : {}),
      },
    })

    return NextResponse.json({ url: session.url })
  }

  // ── Membership checkout ──────────────────────────────────────
  if (type === 'membership') {
    const plan = itemId as MembershipPlan
    const priceId = MEMBERSHIP_PRICES[plan]

    if (!priceId) {
      return NextResponse.json(
        { error: `Membership plan "${plan}" is not configured. Contact support.` },
        { status: 400 },
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      line_items:         [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/membership`,
      metadata: {
        type:    'membership',
        item_id: plan,
        user_id: user!.id,
      },
    })

    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Invalid checkout type.' }, { status: 400 })
}
