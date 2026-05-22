import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation } from '@/lib/email'
import type { Database, MembershipPlan, MembershipStatus, TripTier } from '@/types/database'

export const runtime = 'nodejs'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getUserEmail(admin: ReturnType<typeof getAdminClient>, userId: string): Promise<string | null> {
  const { data } = await admin.from('users').select('email').eq('id', userId).single()
  return data?.email ?? null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = getAdminClient()
  const meta  = session.metadata ?? {}
  const type    = meta.type    as 'event' | 'trip' | 'membership' | undefined
  const userId  = meta.user_id  || null
  const itemId  = meta.item_id as string | undefined
  const guestName  = meta.guest_name  || null
  const guestEmail = meta.guest_email || null
  const guestPhone = meta.guest_phone || null

  if (!type || !itemId) return

  // ── Event ────────────────────────────────────────────────────
  if (type === 'event') {
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)

    const { error } = await admin.rpc('create_event_ticket', {
      p_event_id:          itemId,
      p_booking_ref:       bookingRef,
      p_qr_code:           qrCode,
      p_stripe_payment_id: session.id,
      p_quantity:          Number(meta.quantity ?? 1),
      p_user_id:           userId || undefined,
      p_guest_name:        guestName  || undefined,
      p_guest_email:       guestEmail || undefined,
      p_guest_phone:       guestPhone || undefined,
    })

    if (error) {
      console.error('[webhook event ticket]', error.message)
      return
    }

    if (userId) {
      await admin.from('notifications').insert({
        user_id: userId,
        type:    'booking_confirmed',
        message: `Your ticket is confirmed. Ref: ${bookingRef}`,
        read:    false,
      })
    }

    const toEmail = guestEmail ?? (userId ? await getUserEmail(admin, userId) : null)
    const toName  = guestName ?? 'there'
    if (toEmail) {
      await sendBookingConfirmation({
        to:       toEmail,
        name:     toName,
        bookingRef,
        qrCode,
        title:    meta.event_title ?? 'your event',
        type:     'event',
        date:     meta.event_date  || undefined,
        location: meta.location    || undefined,
      })
    }
  }

  // ── Trip ─────────────────────────────────────────────────────
  if (type === 'trip') {
    const tier       = (meta.tier ?? 'standard') as TripTier
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)

    const { error } = await admin.rpc('create_trip_booking', {
      p_trip_id:           itemId,
      p_tier:              tier,
      p_booking_ref:       bookingRef,
      p_qr_code:           qrCode,
      p_stripe_payment_id: session.id,
      p_user_id:           userId || undefined,
      p_guest_name:        guestName  || undefined,
      p_guest_email:       guestEmail || undefined,
      p_guest_phone:       guestPhone || undefined,
    })

    if (error) {
      console.error('[webhook trip booking]', error.message)
      return
    }

    if (userId) {
      await admin.from('notifications').insert({
        user_id: userId,
        type:    'booking_confirmed',
        message: `Your trip booking is confirmed. Ref: ${bookingRef}`,
        read:    false,
      })
    }

    const toEmail = guestEmail ?? (userId ? await getUserEmail(admin, userId) : null)
    const toName  = guestName ?? 'there'
    if (toEmail) {
      await sendBookingConfirmation({
        to:          toEmail,
        name:        toName,
        bookingRef,
        qrCode,
        title:       meta.trip_title ?? 'your trip',
        type:        'trip',
        date:        meta.trip_date   || undefined,
        location:    meta.destination || undefined,
        whatsappUrl: meta.whatsapp_group_url || undefined,
      })
    }
  }

  // ── Membership ───────────────────────────────────────────────
  if (type === 'membership') {
    if (!userId) return
    const plan              = itemId as MembershipPlan
    const subscriptionId    = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null

    const { error } = await admin.from('memberships').upsert(
      {
        user_id:                userId,
        plan,
        status:                 'active' as const,
        stripe_subscription_id: subscriptionId,
        start_date:             new Date().toISOString(),
        end_date:               null,
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[webhook membership]', error.message)
      return
    }

    await admin.from('notifications').insert({
      user_id: userId,
      type:    'booking_confirmed',
      message: `Your ${plan} membership is now active.`,
      read:    false,
    })
  }

  // ── Decrement promo code uses ────────────────────────────────
  if (meta.promo_code_id) {
    await admin.rpc('decrement_promo_uses', { p_id: meta.promo_code_id })
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  forceStatus?: MembershipStatus,
) {
  const admin    = getAdminClient()
  const statusMap: Record<string, MembershipStatus> = {
    active:   'active',
    trialing: 'trialing',
    canceled: 'cancelled',
    past_due: 'expired',
    unpaid:   'expired',
  }
  const status: MembershipStatus = forceStatus ?? statusMap[subscription.status] ?? 'expired'
  const endDate = forceStatus === 'cancelled'
    ? new Date().toISOString()
    : null

  await admin
    .from('memberships')
    .update({ status, ...(endDate ? { end_date: endDate } : {}) })
    .eq('stripe_subscription_id', subscription.id)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook signature]', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, 'cancelled')
        break

      default:
        break
    }
  } catch (err) {
    console.error('[webhook handler]', err)
  }

  return NextResponse.json({ received: true })
}
