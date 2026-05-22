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

// Calculate membership end_date based on plan
function membershipEndDate(plan: MembershipPlan): string {
  const d = new Date()
  if (plan === 'basic')   d.setDate(d.getDate() + 30)
  if (plan === 'premium') d.setDate(d.getDate() + 180)
  if (plan === 'vip')     d.setDate(d.getDate() + 365)
  return d.toISOString()
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = getAdminClient()
  const meta  = session.metadata ?? {}
  const type       = meta.type    as 'event' | 'trip' | 'membership' | undefined
  const userId     = meta.user_id  || null
  const itemId     = meta.item_id as string | undefined
  const guestName  = meta.guest_name  || null
  const guestEmail = meta.guest_email || null
  const guestPhone = meta.guest_phone || null

  console.log('[webhook checkout.session.completed]', {
    sessionId:    session.id,
    mode:         session.mode,
    type,
    itemId,
    userId,
    hasGuestEmail: !!guestEmail,
  })

  if (!type || !itemId) {
    console.error('[webhook] missing type or itemId in metadata, skipping', meta)
    return
  }

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
    console.log('[webhook membership] received checkout.session.completed', {
      sessionId:      session.id,
      mode:           session.mode,
      userId,
      plan:           itemId,
      subscription:   session.subscription,
      customer:       session.customer,
    })

    if (session.mode !== 'subscription') {
      console.error('[webhook membership] unexpected session mode:', session.mode)
      return
    }

    if (!userId) {
      console.error('[webhook membership] no user_id in session metadata — cannot update membership')
      return
    }

    const plan           = itemId as MembershipPlan
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null
    const customerId     = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer | null)?.id ?? null
    const endDate        = membershipEndDate(plan)
    const startDate      = new Date().toISOString()

    console.log('[webhook membership] upserting', {
      userId,
      plan,
      subscriptionId,
      customerId,
      startDate,
      endDate,
    })

    const { error } = await admin.from('memberships').upsert(
      {
        user_id:                userId,
        plan,
        status:                 'active' as MembershipStatus,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id:     customerId,
        start_date:             startDate,
        end_date:               endDate,
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[webhook membership] upsert failed:', {
        message: error.message,
        code:    error.code,
        details: error.details,
        hint:    error.hint,
      })
      return
    }

    console.log('[webhook membership] upsert succeeded for user', userId)

    // Also sync membership_status on the profiles table for fast lookups
    await admin.from('profiles').update({ membership_status: 'active' }).eq('user_id', userId)

    await admin.from('notifications').insert({
      user_id: userId,
      type:    'booking_confirmed',
      message: `Your ${plan} membership is now active. Welcome!`,
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
  const admin = getAdminClient()

  const statusMap: Record<string, MembershipStatus> = {
    active:            'active',
    trialing:          'trialing',
    canceled:          'expired',
    past_due:          'expired',
    unpaid:            'expired',
    incomplete:        'expired',
    incomplete_expired:'expired',
  }
  const status: MembershipStatus = forceStatus ?? statusMap[subscription.status] ?? 'expired'

  // When a subscription is deleted/cancelled, set end_date to current_period_end
  // so the user keeps access until their paid period is over.
  const endDate = (forceStatus === 'expired' || status === 'expired')
    ? new Date((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000).toISOString()
    : null

  console.log('[webhook subscription change]', {
    subscriptionId: subscription.id,
    stripeStatus:   subscription.status,
    mappedStatus:   status,
    endDate,
  })

  const { error } = await admin
    .from('memberships')
    .update({
      status,
      ...(endDate ? { end_date: endDate } : {}),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[webhook subscription change] update failed:', {
      message: error.message,
      code:    error.code,
    })
    return
  }

  // Sync membership_status on profiles table
  if (status !== 'active' && status !== 'trialing') {
    const { data: mem } = await admin
      .from('memberships')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (mem?.user_id) {
      await admin.from('profiles').update({ membership_status: status }).eq('user_id', mem.user_id)
    }
  }

  console.log('[webhook subscription change] updated status to', status, 'for subscription', subscription.id)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  console.log('[webhook] received event, sig present:', !!sig, 'secret present:', !!process.env.STRIPE_WEBHOOK_SECRET)

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook signature error]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[webhook] event type:', event.type, 'id:', event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, 'expired')
        break

      default:
        console.log('[webhook] unhandled event type:', event.type)
        break
    }
  } catch (err) {
    console.error('[webhook handler error]', err instanceof Error ? err.message : err)
    // Still return 200 so Stripe doesn't retry — the error is logged for investigation
  }

  return NextResponse.json({ received: true })
}
