import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
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
  groupSize?:  number
  promoCode?:  string
  guestName?:  string
  guestEmail?: string
  guestPhone?: string
  attendees?:  { name: string; email: string }[]
}

function applyDiscount(price: number, type: 'percentage' | 'fixed', value: number): number {
  const discounted = type === 'percentage'
    ? price * (1 - value / 100)
    : price - value
  return Math.max(0, discounted)
}

// Resolves the canonical app URL across local / Vercel preview / Vercel production
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_APP_URL)  return process.env.NEXT_PUBLIC_APP_URL
  // VERCEL_URL is set automatically by Vercel on every deployment (server-only, no HTTPS prefix)
  if (process.env.VERCEL_URL)           return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const MEMBERSHIP_PRICES: Record<MembershipPlan, string | undefined> = {
  basic:   process.env.STRIPE_PRICE_BASIC,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  vip:     process.env.STRIPE_PRICE_VIP,
}

export async function POST(request: NextRequest) {
  // Fail fast with a clean JSON error rather than an HTML 500 that breaks res.json()
  try {
    return await handleCheckout(request)
  } catch (err) {
    console.error('[create-checkout] unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleCheckout(request: NextRequest): Promise<NextResponse> {
  // Guard: Stripe key must exist before any Stripe call
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[create-checkout] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
      { status: 500 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body: Body = await request.json()
  const { type, itemId, tier, quantity = 1, groupSize, promoCode, guestName, guestEmail, guestPhone, attendees } = body

  console.log('[create-checkout]', { type, itemId, tier, quantity, hasUser: !!user })

  const baseUrl = getBaseUrl()

  // Membership still requires auth
  if (type === 'membership' && !user) {
    return NextResponse.json({ error: 'Please log in to purchase a membership.' }, { status: 401 })
  }

  // Membership discount: check memberships table + profiles fallback
  let memberDiscount = false
  if (user) {
    const [{ data: mem, error: memErr }, { data: profile }] = await Promise.all([
      supabase
        .from('memberships')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('membership_status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    if (memErr) console.error('[create-checkout] membership check error:', memErr.message)
    memberDiscount = !!(mem || profile?.membership_status === 'active')
    console.log('[create-checkout] membership check:', {
      userId: user.id,
      memberDiscount,
      memFound:       !!mem,
      profileStatus:  profile?.membership_status,
    })
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
      .select('id, title, price, price_early_bird, price_group, early_bird_deadline, early_bird_seats, early_bird_seats_sold, capacity, tickets_sold, slug, image_url, date, location')
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

    // Resolve tier-based price for events
    const isEbValid =
      tier === 'early_bird' &&
      event.price_early_bird != null &&
      event.early_bird_deadline != null &&
      new Date(event.early_bird_deadline) > new Date() &&
      (event.early_bird_seats - event.early_bird_seats_sold) > 0

    const baseEventPrice =
      isEbValid                              ? (event.price_early_bird ?? event.price)
      : tier === 'group' && event.price_group != null ? event.price_group
      : event.price

    let unitPrice = discountType
      ? applyDiscount(baseEventPrice, discountType, discountValue)
      : baseEventPrice
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
        event_title: event.title,
        event_date:  event.date   ?? '',
        location:    event.location ?? '',
        attendees:   JSON.stringify(attendees ?? []),
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

    const tripGroupSize = tripTier === 'group' ? (groupSize ?? 1) : 1

    const session = await stripe.checkout.sessions.create({
      mode:           'payment',
      customer_email: toEmail ?? undefined,
      line_items: [{
        quantity: tripGroupSize,
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
        type:               'trip',
        item_id:            trip.id,
        user_id:            user?.id        ?? '',
        tier:               tripTier,
        quantity:           String(tripGroupSize),
        guest_name:         guestName       ?? '',
        guest_email:        guestEmail      ?? '',
        guest_phone:        guestPhone      ?? '',
        trip_title:         trip.title,
        trip_date:          trip.start_date ?? '',
        destination:        trip.destination ?? '',
        whatsapp_group_url: trip.whatsapp_group_url ?? '',
        attendees:          JSON.stringify(attendees ?? []),
        ...(promoCodeId ? { promo_code_id: promoCodeId } : {}),
      },
    })

    return NextResponse.json({ url: session.url })
  }

  // ── Membership checkout ──────────────────────────────────────
  if (type === 'membership') {
    const plan    = itemId as MembershipPlan
    const priceId = MEMBERSHIP_PRICES[plan]

    console.log('[create-checkout membership]', {
      plan,
      priceId:        priceId ?? 'MISSING',
      hasBasicEnv:    !!process.env.STRIPE_PRICE_BASIC,
      hasPremiumEnv:  !!process.env.STRIPE_PRICE_PREMIUM,
      hasVipEnv:      !!process.env.STRIPE_PRICE_VIP,
    })

    if (!priceId) {
      return NextResponse.json(
        { error: `Membership plan "${plan}" is not configured — STRIPE_PRICE_${plan.toUpperCase()} is missing. Contact support.` },
        { status: 400 },
      )
    }

    // Cancel any existing active subscription so the user is never billed twice
    const adminClient = getAdminClient()
    const { data: existingMembership } = await adminClient
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingMembership?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(existingMembership.stripe_subscription_id)
        console.log('[create-checkout membership] cancelled old subscription:', existingMembership.stripe_subscription_id)
      } catch (e) {
        console.warn('[create-checkout membership] failed to cancel old subscription:', e)
      }
      await adminClient
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('user_id', user!.id)
    }

    const membershipMeta = {
      type:    'membership',
      item_id: plan,
      plan,              // explicit duplicate so subscription object also carries it
      user_id: user!.id,
    }

    const session = await stripe.checkout.sessions.create({
      mode:           'subscription',
      customer_email: user!.email ?? undefined,
      line_items:     [{ price: priceId, quantity: 1 }],
      // subscription_data.metadata copies onto the subscription object itself,
      // making user_id + plan available in customer.subscription.* events.
      subscription_data: { metadata: membershipMeta },
      success_url:       `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:        `${baseUrl}/membership`,
      metadata:          membershipMeta,
    })

    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Invalid checkout type.' }, { status: 400 })
}
