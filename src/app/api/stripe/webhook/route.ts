import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { generateQR } from '@/lib/qr'
import { nanoid } from 'nanoid'
import { sendBookingConfirmation, sendGroupBookingConfirmation, sendMembershipWelcomeEmail, sendBookingPendingEmail, sendPartnerConfirmationRequest, sendRefundEmail } from '@/lib/email'
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
  if (plan === 'basic')    d.setDate(d.getDate() + 30)
  if (plan === 'premium')  d.setDate(d.getDate() + 180)
  if (plan === 'vip')      d.setDate(d.getDate() + 365)
  if (plan === 'employer') d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = getAdminClient()
  const meta  = session.metadata ?? {}
  const type       = meta.type    as 'event' | 'trip' | 'membership' | 'room_contact' | 'job_listing' | 'employer_subscription' | 'job_upgrade' | undefined
  const userId     = meta.user_id  || null
  const itemId     = meta.item_id as string | undefined
  const guestName  = meta.guest_name  || null
  const guestEmail = meta.guest_email || null
  const guestPhone = meta.guest_phone || null
  const amountPaid = (session.amount_total ?? 0) / 100

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

  // room_contact, membership, and job_upgrade don't require item_id in all cases
  if (type !== 'room_contact' && type !== 'membership' && type !== 'job_upgrade' && !itemId) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seatResult } = await (admin as any).rpc('book_event_seats', {
        p_event_id: itemId!,
        p_quantity:  rawAttendees.length,
      })
      if (!seatResult?.success) {
        console.error('[webhook] event seat booking failed:', seatResult?.error)
        await stripe.refunds.create({ payment_intent: session.payment_intent as string })
        await sendRefundEmail({
          email:     guestEmail ?? '',
          name:      guestName  ?? 'there',
          tripTitle: meta.event_title ?? 'your event',
          amount:    amountPaid,
          reason:    seatResult?.error ?? 'Event sold out',
        })
        return
      }

      const amountPerTicket = amountPaid / rawAttendees.length
      const allTickets: { name: string; bookingRef: string; qrCode: string }[] = []
      let firstBookingRef = ''
      const groupRef = nanoid(8).toUpperCase()

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
          group_booking_ref: groupRef,
          is_group_booking:  true,
          lead_name:         guestName  || null,
          lead_email:        guestEmail || null,
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
      // Single-ticket path (backward compat)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seatResult } = await (admin as any).rpc('book_event_seats', {
        p_event_id: itemId!,
        p_quantity:  Number(meta.quantity ?? 1),
      })
      if (!seatResult?.success) {
        console.error('[webhook] event seat booking failed:', seatResult?.error)
        await stripe.refunds.create({ payment_intent: session.payment_intent as string })
        await sendRefundEmail({
          email:     guestEmail ?? '',
          name:      guestName  ?? 'there',
          tripTitle: meta.event_title ?? 'your event',
          amount:    amountPaid,
          reason:    seatResult?.error ?? 'Event sold out',
        })
        return
      }

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
    const tier = (meta.tier ?? 'standard') as TripTier
    const rawAttendees: { name: string; email: string }[] =
      meta.attendees ? (JSON.parse(meta.attendees) as { name: string; email: string }[]) : []

    const tripAttendees = rawAttendees.length > 0
      ? rawAttendees
      : [{ name: guestName ?? '', email: guestEmail ?? '' }]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seatResult } = await (admin as any).rpc('book_trip_seats', {
      p_trip_id:  itemId!,
      p_quantity: tripAttendees.length,
    })
    if (!seatResult?.success) {
      console.error('[webhook] trip seat booking failed:', seatResult?.error)
      await stripe.refunds.create({ payment_intent: session.payment_intent as string })
      await sendRefundEmail({
        email:     guestEmail ?? '',
        name:      guestName  ?? 'there',
        tripTitle: meta.trip_title ?? 'your trip',
        amount:    amountPaid,
        reason:    seatResult?.error ?? 'Trip fully booked',
      })
      return
    }

    const groupRef   = nanoid(8).toUpperCase()
    const isGroup    = tripAttendees.length > 1
    const amountEach = amountPaid / tripAttendees.length
    const allTickets: { name: string; bookingRef: string; qrCode: string }[] = []
    let firstRef = ''

    for (let i = 0; i < tripAttendees.length; i++) {
      const attendee   = tripAttendees[i]
      const bookingRef = nanoid(8).toUpperCase()
      const qrCode     = await generateQR(bookingRef)
      const toAddr     = attendee.email?.trim() || guestEmail || null
      if (!firstRef) firstRef = bookingRef

      const tripRow = {
        trip_id:           itemId!,
        user_id:           i === 0 ? userId : null,
        tier,
        booking_ref:       bookingRef,
        qr_code:           qrCode,
        stripe_payment_id: session.id,
        guest_name:        attendee.name  || null,
        guest_email:       toAddr,
        guest_phone:       i === 0 ? guestPhone : null,
        status:            'confirmed' as const,
        amount_paid:       amountEach,
        quantity:          1,
        deposit_paid:      true,
        group_booking_ref: isGroup ? groupRef : null,
        is_group_booking:  isGroup,
        lead_name:         isGroup ? (guestName || null) : null,
        lead_email:        isGroup ? (guestEmail || null) : null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await admin.from('trip_bookings').insert(tripRow as any)
      if (insertErr) console.error(`[webhook trip booking #${i + 1}]`, insertErr.message)

      allTickets.push({ name: attendee.name, bookingRef, qrCode })

      if (toAddr) {
        await sendBookingConfirmation({
          to:          toAddr,
          name:        attendee.name,
          bookingRef,
          qrCode,
          title:       meta.trip_title ?? 'your trip',
          type:        'trip',
          date:        meta.trip_date   || undefined,
          location:    meta.destination || undefined,
          whatsappUrl: meta.whatsapp_group_url || undefined,
        })
        console.log(`[webhook] trip ticket sent to: ${toAddr}`)
      }
    }

    if (tier === 'early_bird') {
      // @ts-expect-error — RPC added via SQL; types regenerate after `supabase gen types`
      const { error: ebErr } = await admin.rpc('increment_early_bird_sold', {
        p_trip_id:  itemId!,
        p_quantity: tripAttendees.length,
      })
      if (ebErr) console.error('❌ Early bird seat update failed:', ebErr)
      else       console.log('✅ Early bird seats updated:', itemId, tripAttendees.length)
    }

    if (userId) {
      await admin.from('notifications').insert({
        user_id: userId,
        type:    'booking_confirmed',
        message: `Your trip booking is confirmed. Ref: ${firstRef}`,
        read:    false,
      })
    }

    if (isGroup) {
      const toEmail = guestEmail ?? (userId ? await getUserEmail(admin, userId) : null)
      if (toEmail) {
        await sendGroupBookingConfirmation({
          to:            toEmail,
          leadName:      guestName ?? 'there',
          eventTitle:    meta.trip_title ?? 'your trip',
          eventDate:     meta.trip_date  || undefined,
          eventLocation: meta.destination || undefined,
          tickets:       allTickets,
          type:          'trip',
        })
      }
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

  // ── Job listing ──────────────────────────────────────────────
  if (type === 'job_listing') {
    const isFeatured = meta.is_featured === 'true'
    const isUrgent   = meta.is_urgent   === 'true'
    const daysActive = isFeatured ? 60 : 30
    const expiresAt  = new Date(Date.now() + daysActive * 24 * 60 * 60 * 1000).toISOString()

    const { error: jobErr } = await admin
      .from('job_listings')
      .update({
        status:      'active',
        is_featured: isFeatured,
        is_urgent:   isUrgent,
        expires_at:  expiresAt,
      })
      .eq('id', itemId!)

    if (jobErr) console.error('[webhook job_listing]', jobErr.message)
    else        console.log('[webhook job_listing] activated job', itemId, { isFeatured, isUrgent })
  }

  // ── Employer subscription ────────────────────────────────────
  if (type === 'employer_subscription') {
    const isUrgent       = meta.is_urgent === 'true'
    const expiresAt      = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null
    const customerId     = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer | null)?.id ?? null

    // Activate the specific job listing
    const { error: jobErr } = await admin
      .from('job_listings')
      .update({ status: 'active', is_featured: true, is_urgent: isUrgent, expires_at: expiresAt })
      .eq('id', itemId!)
    if (jobErr) console.error('[webhook employer_subscription job]', jobErr.message)
    else        console.log('[webhook employer_subscription] activated job', itemId, { isUrgent })

    // Store employer subscription in memberships table
    if (userId) {
      const { error: memErr } = await admin.from('memberships').upsert(
        {
          user_id:                userId,
          plan:                   'employer' as MembershipPlan,
          status:                 'active' as MembershipStatus,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id:     customerId,
          start_date:             new Date().toISOString(),
          end_date:               expiresAt,
        },
        { onConflict: 'user_id', ignoreDuplicates: false },
      )
      if (memErr) console.error('[webhook employer_subscription membership]', memErr.message)
    }
  }

  // ── Job upgrade (featured / employer subscription) ───────────
  if (type === 'job_upgrade') {
    const upgradeType = meta.upgrade_type
    const employerId  = meta.employer_id || meta.item_id   // item_id is fallback
    const jobId       = meta.item_id || null

    console.log('[webhook job_upgrade] processing', { upgradeType, employerId, jobId, sessionId: session.id })

    if (!employerId) {
      console.error('[webhook job_upgrade] missing employer_id in metadata', meta)
    }

    if (upgradeType === 'featured' && jobId) {
      const { error: jobErr } = await admin
        .from('job_listings')
        .update({
          is_featured: true,
          expires_at:  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', jobId)
      if (jobErr) console.error('[webhook job_upgrade] ❌ feature job failed:', jobErr.message)
      else        console.log('[webhook job_upgrade] ✅ featured job', jobId)

      if (employerId) {
        const { error: empErr } = await admin
          .from('employer_accounts')
          .update({ plan: 'featured' })
          .eq('id', employerId)
        if (empErr) console.error('[webhook job_upgrade] ❌ employer plan update failed:', empErr.message)
        else        console.log('[webhook job_upgrade] ✅ employer plan set to featured', employerId)
      }
    }

    if (upgradeType === 'subscription' && employerId) {
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id ?? null
      const customerId     = typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id ?? null
      const expiresAt      = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      console.log('[webhook job_upgrade] upgrading employer to subscription', { employerId, subscriptionId, customerId })

      const { data: empData, error: empErr } = await admin
        .from('employer_accounts')
        .update({
          plan:                    'subscription',
          stripe_subscription_id:  subscriptionId,
          stripe_customer_id:      customerId,
          plan_expires_at:         expiresAt,
        })
        .eq('id', employerId)
        .select('id, plan')
      if (empErr) console.error('[webhook job_upgrade] ❌ employer subscription update failed:', empErr.message, empErr)
      else        console.log('[webhook job_upgrade] ✅ employer upgraded to subscription', empData)

      // Feature ALL active listings for this employer
      const { error: featErr } = await admin
        .from('job_listings')
        .update({ is_featured: true })
        .eq('employer_account_id', employerId)
        .eq('status', 'active')
      if (featErr) console.error('[webhook job_upgrade] ❌ feature all listings failed:', featErr.message)
      else         console.log('[webhook job_upgrade] ✅ all active listings featured for employer', employerId)
    }
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

  // ── Employer subscription backup handler ─────────────────────
  // checkout.session.completed should handle this, but this catches
  // cases where that event is missed or metadata is absent there.
  const subMeta = (subscription.metadata ?? {}) as Record<string, string>
  if (subMeta.type === 'job_upgrade' && subMeta.upgrade_type === 'subscription') {
    const employerId = subMeta.employer_id
    console.log('[webhook subscription change] employer subscription event', { employerId, status: subscription.status })

    if (employerId) {
      const isActive = subscription.status === 'active' || subscription.status === 'trialing'
      const periodEnd = (subscription as Stripe.Subscription & { current_period_end: number }).current_period_end

      const { error: empErr } = await admin
        .from('employer_accounts')
        .update({
          plan:                    isActive ? 'subscription' : 'free',
          stripe_subscription_id:  subscription.id,
          plan_expires_at:         new Date(periodEnd * 1000).toISOString(),
        })
        .eq('id', employerId)

      if (empErr) console.error('[webhook subscription change] ❌ employer update failed:', empErr.message)
      else        console.log('[webhook subscription change] ✅ employer plan synced', { employerId, isActive })

      if (isActive) {
        await admin
          .from('job_listings')
          .update({ is_featured: true })
          .eq('employer_account_id', employerId)
          .eq('status', 'active')
      }
      return  // don't touch the memberships table
    }
  }

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
