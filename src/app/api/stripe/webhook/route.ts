import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation, sendGroupBookingConfirmation, sendMembershipWelcomeEmail, sendBookingPendingEmail, sendPartnerConfirmationRequest } from '@/lib/email'
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
  const type       = meta.type    as 'event' | 'trip' | 'membership' | 'room_contact' | undefined
  const userId     = meta.user_id  || null
  const itemId     = meta.item_id as string | undefined
  const guestName  = meta.guest_name  || null
  const guestEmail = meta.guest_email || null
  const guestPhone = meta.guest_phone || null
  const amountPaid = (session.amount_total ?? 0) / 100
  const quantity   = Number(meta.quantity ?? 1)

  console.log('[webhook checkout.session.completed]', {
    sessionId:    session.id,
    mode:         session.mode,
    type,
    itemId,
    userId,
    hasGuestEmail: !!guestEmail,
  })

  if (!type) {
    console.error('[webhook] missing type in metadata, skipping', meta)
    return
  }

  // room_contact and membership don't use itemId — only event/trip do
  if (type !== 'room_contact' && type !== 'membership' && !itemId) {
    console.error('[webhook] missing itemId for type:', type, meta)
    return
  }

  // ── Event ────────────────────────────────────────────────────
  if (type === 'event') {
    const rawAttendees = meta.attendees
      ? (JSON.parse(meta.attendees) as { name: string; email: string }[])
      : []

    if (rawAttendees.length > 1) {
      // Multi-ticket: one row + QR per named attendee
      const amountPerTicket = amountPaid / rawAttendees.length
      const allTickets: { name: string; bookingRef: string; qrCode: string }[] = []
      let firstBookingRef = ''

      for (let i = 0; i < rawAttendees.length; i++) {
        const attendee  = rawAttendees[i]
        const bookingRef = nanoid(8).toUpperCase()
        const qrCode     = await generateQR(bookingRef)
        const recipientEmail = attendee.email?.trim() || guestEmail || null

        const { error: insertErr } = await admin.from('event_tickets').insert({
          event_id:          itemId!,
          user_id:           i === 0 ? userId : null,
          booking_ref:       bookingRef,
          qr_code:           qrCode,
          stripe_payment_id: session.id,
          guest_name:        attendee.name  || null,
          guest_email:       recipientEmail,
          guest_phone:       i === 0 ? guestPhone : null,
          status:            'active' as const,
          amount_paid:       amountPerTicket,
        })
        if (insertErr) console.error(`[webhook event ticket #${i + 1}]`, insertErr.message)

        if (!firstBookingRef) firstBookingRef = bookingRef
        allTickets.push({ name: attendee.name, bookingRef, qrCode })

        // Individual email to every attendee who has an email address
        if (recipientEmail) {
          await sendBookingConfirmation({
            to:       recipientEmail,
            name:     attendee.name,
            bookingRef,
            qrCode,
            title:    meta.event_title ?? 'your event',
            type:     'event',
            date:     meta.event_date  || undefined,
            location: meta.location    || undefined,
          })
          console.log(`[webhook] individual ticket sent to: ${recipientEmail}`)
        }
      }

      // @ts-expect-error — RPC added via SQL; types regenerate after `supabase gen types`
      const { error: seatError } = await admin.rpc('increment_tickets_sold', {
        p_event_id: itemId!,
        p_quantity:  rawAttendees.length,
      })
      if (seatError) console.error('❌ Seat update failed:', seatError)
      else           console.log('✅ Seats updated:', itemId, rawAttendees.length)

      if (userId) {
        await admin.from('notifications').insert({
          user_id: userId,
          type:    'booking_confirmed',
          message: `Your ${rawAttendees.length} tickets are confirmed. Ref: ${firstBookingRef}`,
          read:    false,
        })
      }

      // Group summary to lead booker with all QR codes
      const toEmail = guestEmail ?? (userId ? await getUserEmail(admin, userId) : null)
      if (toEmail) {
        await sendGroupBookingConfirmation({
          to:            toEmail,
          leadName:      guestName ?? 'there',
          eventTitle:    meta.event_title ?? 'your event',
          eventDate:     meta.event_date  || undefined,
          eventLocation: meta.location    || undefined,
          tickets:       allTickets,
        })
      }
    } else {
      // Single-ticket path (backward compat) — unchanged
      const bookingRef = nanoid(8).toUpperCase()
      const qrCode     = await generateQR(bookingRef)

      const { error } = await admin.rpc('create_event_ticket', {
        p_event_id:          itemId!,
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

      await admin.from('event_tickets').update({ amount_paid: amountPaid }).eq('booking_ref', bookingRef)

      // @ts-expect-error — RPC added via SQL; types regenerate after `supabase gen types`
      const { error: seatError } = await admin.rpc('increment_tickets_sold', {
        p_event_id: itemId!,
        p_quantity:  Number(meta.quantity ?? 1),
      })
      if (seatError) console.error('❌ Seat update failed:', seatError)
      else           console.log('✅ Seats updated:', itemId, Number(meta.quantity ?? 1))

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
  }

  // ── Trip ─────────────────────────────────────────────────────
  if (type === 'trip') {
    const tier       = (meta.tier ?? 'standard') as TripTier
    const bookingRef = nanoid(8).toUpperCase()
    const qrCode     = await generateQR(bookingRef)

    const { error } = await admin.rpc('create_trip_booking', {
      p_trip_id:           itemId!,
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

    await admin.from('trip_bookings').update({ amount_paid: amountPaid, quantity }).eq('booking_ref', bookingRef)

    // @ts-expect-error — RPC added via SQL; types regenerate after `supabase gen types`
    const { error: seatError } = await admin.rpc('increment_seats_sold', {
      p_trip_id:  itemId!,
      p_quantity: Number(meta.quantity ?? 1),
    })
    if (seatError) console.error('❌ Seat update failed:', seatError)
    else           console.log('✅ Seats updated:', itemId, 1)

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
      { onConflict: 'user_id', ignoreDuplicates: false },
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

    // Send welcome email
    const toEmail = session.customer_details?.email
      ?? (userId ? await getUserEmail(admin, userId) : null)
    const toName  = session.customer_details?.name ?? 'there'
    console.log('[webhook membership] sending welcome email to:', toEmail, 'plan:', plan)
    if (toEmail) {
      await sendMembershipWelcomeEmail({ to: toEmail, name: toName, plan, endDate })
    }

    // Also sync membership_status on the profiles table for fast lookups
    await admin.from('profiles').update({ membership_status: 'active' }).eq('user_id', userId)

    await admin.from('notifications').insert({
      user_id: userId,
      type:    'booking_confirmed',
      message: `Your ${plan} membership is now active. Welcome!`,
      read:    false,
    })
  }

  // ── Room contact ─────────────────────────────────────────────
  if (type === 'room_contact') {
    const bookingRef = meta.booking_ref
    const roomId     = meta.room_id
    const partnerId  = meta.partner_id
    const baseUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
    const deadline   = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    // 1. Save booking as PENDING
    const { error: rcErr } = await admin.from('room_contacts').insert({
      room_id:               roomId,
      partner_id:            partnerId,
      booking_ref:           bookingRef,
      guest_name:            meta.guest_name,
      guest_email:           meta.guest_email,
      guest_phone:           meta.guest_phone        || null,
      guest_nationality:     meta.guest_nationality  || null,
      university:            meta.university         || null,
      move_in_date:          meta.move_in_date       || null,
      duration_months:       parseInt(meta.duration  ?? '1', 10),
      message:               meta.message            || null,
      platform_fee:          amountPaid,
      stripe_payment_id:     session.id,
      status:                'pending',
      confirmation_deadline: deadline,
    })

    if (rcErr) {
      console.error('[webhook room_contact] insert failed:', rcErr.message)
      return
    }

    // 2. Mark room as reserved
    await admin
      .from('partner_rooms')
      .update({ status: 'reserved' })
      .eq('id', roomId)

    // 3. Send pending email to student
    await sendBookingPendingEmail({
      to:           meta.guest_email,
      guestName:    meta.guest_name,
      roomTitle:    meta.room_title,
      neighborhood: meta.neighborhood      ?? '',
      monthlyRent:  meta.monthly_rent      ? Number(meta.monthly_rent)   : undefined,
      depositAmount: meta.deposit_amount   ? Number(meta.deposit_amount) : undefined,
      moveInDate:   meta.move_in_date      ?? '',
      duration:     meta.duration          ?? '',
      bookingRef,
    })

    // 4. Send confirmation request to partner
    if (meta.partner_email) {
      await sendPartnerConfirmationRequest({
        to:              meta.partner_email,
        partnerName:     meta.partner_name,
        guestName:       meta.guest_name,
        guestEmail:      meta.guest_email,
        guestPhone:      meta.guest_phone       ?? '',
        guestNationality: meta.guest_nationality ?? '',
        university:      meta.university        ?? '',
        roomTitle:       meta.room_title,
        moveInDate:      meta.move_in_date      ?? '',
        duration:        meta.duration          ?? '1',
        message:         meta.message           ?? '',
        bookingRef,
        confirmUrl: `${baseUrl}/api/housing/confirm-booking?ref=${bookingRef}&action=confirm`,
        rejectUrl:  `${baseUrl}/api/housing/confirm-booking?ref=${bookingRef}&action=reject`,
      })
    }

    console.log('[webhook room_contact] pending booking created', bookingRef)
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

  const { error, data: updatedRows } = await admin
    .from('memberships')
    .update({
      status,
      ...(endDate ? { end_date: endDate } : {}),
    })
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id')

  if (error) {
    console.error('[webhook subscription change] update failed:', {
      message: error.message,
      code:    error.code,
    })
    return
  }

  const count = updatedRows?.length ?? 0
  console.log('[webhook subscription change] rows updated:', count)

  // If 0 rows updated and subscription is active/trialing → no row exists yet.
  // This happens when customer.subscription.created fires before
  // checkout.session.completed, OR when checkout.session.completed was missed.
  // Stripe copies subscription_data.metadata onto the subscription object,
  // so user_id and plan are available here.
  if ((count ?? 0) === 0 && (status === 'active' || status === 'trialing')) {
    const subMeta  = (subscription.metadata ?? {}) as Record<string, string>
    const userId   = subMeta.user_id || null
    const plan     = (subMeta.plan || subMeta.item_id) as MembershipPlan | undefined

    console.log('[webhook subscription change] no existing row — attempting upsert', { userId, plan, subscriptionId: subscription.id })

    if (userId && plan) {
      const { error: upsertErr } = await admin.from('memberships').upsert(
        {
          user_id:                userId,
          plan,
          status,
          stripe_subscription_id: subscription.id,
          start_date:             new Date().toISOString(),
          end_date:               membershipEndDate(plan),
        },
        { onConflict: 'user_id' },
      )
      if (upsertErr) {
        console.error('[webhook subscription change] fallback upsert failed:', upsertErr.message, upsertErr.code)
      } else {
        console.log('[webhook subscription change] fallback upsert succeeded for user', userId)
        await admin.from('profiles').update({ membership_status: status }).eq('user_id', userId)
      }
      return
    } else {
      console.error('[webhook subscription change] no metadata on subscription — cannot create row', subMeta)
    }
  }

  // Sync profiles for the updated row (use updatedRows to avoid a second query)
  const updatedUserId = updatedRows?.[0]?.user_id
  if (updatedUserId) {
    await admin.from('profiles').update({ membership_status: status }).eq('user_id', updatedUserId)
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

      case 'customer.subscription.created':
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
