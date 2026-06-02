export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Crown, Check } from 'lucide-react'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database, MembershipPlan } from '@/types/database'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import BookingConfirmation from './BookingConfirmation'
import BookingPolling from './BookingPolling'

export const metadata: Metadata = {
  title: 'Booking Confirmed | Erasmus Vibe Valencia',
}

type Props = {
  searchParams: Promise<{ session_id?: string; ref?: string }>
}

function getAdminClient() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function buildIcs(params: {
  title:    string
  start:    string
  end:      string
  location: string
  ref:      string
}): string {
  const fmt = (d: string) =>
    new Date(d).toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Erasmus Vibe//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(params.end)}`,
    `SUMMARY:${params.title}`,
    `LOCATION:${params.location}`,
    `DESCRIPTION:Booking ref: ${params.ref}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { session_id, ref } = await searchParams

  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {session_id ? (
          <StripeSuccessContent sessionId={session_id} />
        ) : ref ? (
          <FreeBookingContent bookingRef={ref} />
        ) : (
          <div className="text-center py-16">
            <p className="text-white/40">No booking information found.</p>
            <Link href="/" className="mt-4 inline-block text-brand-primary hover:underline text-sm">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Paid booking (Stripe session_id) ─────────────────────────────

async function StripeSuccessContent({ sessionId }: { sessionId: string }) {
  const admin = getAdminClient()

  const [ticketResult, tripResult] = await Promise.all([
    admin
      .from('event_tickets')
      .select('booking_ref, qr_code, event_id, user_id, guest_email')
      .eq('stripe_payment_id', sessionId)
      .maybeSingle(),
    admin
      .from('trip_bookings')
      .select('booking_ref, qr_code, trip_id, user_id, guest_email')
      .eq('stripe_payment_id', sessionId)
      .maybeSingle(),
  ])

  // Event booking found
  if (ticketResult.data) {
    const booking = ticketResult.data
    const isGuest = !booking.user_id
    const { data: event } = await admin
      .from('events')
      .select('title, date, location')
      .eq('id', booking.event_id)
      .single()

    const icsContent = event
      ? buildIcs({
          title:    event.title,
          start:    event.date,
          end:      new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          location: event.location ?? 'Valencia',
          ref:      booking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={booking.booking_ref}
        qrCode={booking.qr_code}
        icsContent={icsContent}
        title={event?.title}
        showMemberUpsell={isGuest}
      />
    )
  }

  // Trip booking found
  if (tripResult.data) {
    const booking = tripResult.data
    const isGuest = !booking.user_id
    const { data: trip } = await admin
      .from('trips')
      .select('title, start_date, end_date, destination, whatsapp_group_url')
      .eq('id', booking.trip_id)
      .single()

    const icsContent = trip
      ? buildIcs({
          title:    trip.title,
          start:    trip.start_date,
          end:      trip.end_date,
          location: trip.destination,
          ref:      booking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={booking.booking_ref}
        qrCode={booking.qr_code}
        icsContent={icsContent}
        whatsappUrl={trip?.whatsapp_group_url ?? undefined}
        title={trip?.title}
        showMemberUpsell={isGuest}
      />
    )
  }

  // Not an event or trip booking — check if this is a membership payment
  let membershipSession: Stripe.Checkout.Session | null = null
  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (stripeSession.mode === 'subscription' && stripeSession.metadata?.type === 'membership') {
      membershipSession = stripeSession
    }
  } catch (err) {
    console.error('[booking-success] Stripe session retrieve error:', err)
  }

  if (membershipSession) {
    return <MembershipSuccess session={membershipSession} />
  }

  // Webhook hasn't fired yet — poll for event/trip booking
  return <BookingPolling sessionId={sessionId} />
}

// ── Membership success ───────────────────────────────────────────

const PLAN_INFO: Record<MembershipPlan, { name: string; duration: string; perMonth: string }> = {
  basic:    { name: 'Monthly',       duration: '30 days',  perMonth: '€9.99/mo'   },
  premium:  { name: 'Semester',      duration: '6 months', perMonth: '≈€4.17/mo'  },
  vip:      { name: 'Annual',        duration: '1 year',   perMonth: '≈€3.33/mo'  },
  employer: { name: 'Employer Plan', duration: '1 month',  perMonth: '€49/mo'     },
}

function membershipEndDate(plan: MembershipPlan): string {
  const d = new Date()
  if (plan === 'basic')   d.setDate(d.getDate() + 30)
  if (plan === 'premium') d.setDate(d.getDate() + 180)
  if (plan === 'vip')     d.setDate(d.getDate() + 365)
  return d.toISOString()
}

async function MembershipSuccess({ session }: { session: Stripe.Checkout.Session }) {
  const admin     = getAdminClient()
  const userId    = session.metadata?.user_id || null
  const plan      = (session.metadata?.item_id ?? '') as MembershipPlan
  const validPlan = plan in PLAN_INFO ? plan : null

  console.log('[booking-success membership]', { userId, plan, validPlan, sessionId: session.id })

  let activated = false

  if (userId && validPlan) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null

    const { error } = await admin.from('memberships').upsert(
      {
        user_id:                userId,
        plan:                   validPlan,
        status:                 'active',
        stripe_subscription_id: subscriptionId,
        start_date:             new Date().toISOString(),
        end_date:               membershipEndDate(validPlan),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[booking-success membership] upsert failed:', error.message, error.code, error.details)
    } else {
      activated = true
      console.log('[booking-success membership] upsert succeeded for user', userId)
      await admin.from('profiles').update({ membership_status: 'active' }).eq('user_id', userId)
    }
  } else {
    console.error('[booking-success membership] missing userId or plan — skipping upsert', { userId, plan })
  }

  const info = validPlan ? PLAN_INFO[validPlan] : null

  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      {/* Success badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center">
          <Crown size={28} className="text-brand-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-white text-center">
          {activated ? 'Membership Activated!' : 'Payment Received!'}
        </h1>
        <p className="text-white/50 text-center max-w-xs">
          {activated
            ? `Welcome to Erasmus Vibe${info ? ` — ${info.name} plan` : ''}.`
            : 'Your membership is being set up. Check your email or refresh in a moment.'}
        </p>
      </div>

      {/* Plan details card */}
      <div className="glass-card rounded-2xl px-8 py-6 w-full max-w-sm flex flex-col gap-3">
        {(['10% off all events and trips', 'Priority access and member perks', ...(info ? [`Valid for ${info.duration} (${info.perMonth})`] : [])] as string[]).map((text) => (
          <div key={text} className="flex items-center gap-3 text-sm text-white/70">
            <Check size={14} className="text-brand-primary flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Browse Events
        </Link>
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 hover:border-brand-primary/50 hover:text-white text-sm font-medium transition-colors"
        >
          Browse Trips
        </Link>
        {activated && (
          <Link
            href="/member-card"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 text-sm font-semibold transition-colors"
          >
            View Member Card →
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Free booking (ref query param) ───────────────────────────────

async function FreeBookingContent({ bookingRef }: { bookingRef: string }) {
  // Use server client (may be authed or not) — RLS allows reading own bookings
  // Fall back to admin for guest bookings
  const supabase = await createClient()
  const admin    = getAdminClient()

  const { data: ticket } = await admin
    .from('event_tickets')
    .select('booking_ref, qr_code, event_id, user_id, guest_email')
    .eq('booking_ref', bookingRef)
    .maybeSingle()

  if (ticket) {
    const isGuest = !ticket.user_id
    const { data: event } = await supabase
      .from('events')
      .select('title, date, location')
      .eq('id', ticket.event_id)
      .single()

    const icsContent = event
      ? buildIcs({
          title:    event.title,
          start:    event.date,
          end:      new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          location: event.location ?? 'Valencia',
          ref:      ticket.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={ticket.booking_ref}
        qrCode={ticket.qr_code}
        icsContent={icsContent}
        title={event?.title}
        showMemberUpsell={isGuest}
      />
    )
  }

  const { data: tripBooking } = await admin
    .from('trip_bookings')
    .select('booking_ref, qr_code, trip_id, user_id, guest_email')
    .eq('booking_ref', bookingRef)
    .maybeSingle()

  if (tripBooking) {
    const isGuest = !tripBooking.user_id
    const { data: trip } = await supabase
      .from('trips')
      .select('title, start_date, end_date, destination, whatsapp_group_url')
      .eq('id', tripBooking.trip_id)
      .single()

    const icsContent = trip
      ? buildIcs({
          title:    trip.title,
          start:    trip.start_date,
          end:      trip.end_date,
          location: trip.destination,
          ref:      tripBooking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={tripBooking.booking_ref}
        qrCode={tripBooking.qr_code}
        icsContent={icsContent}
        whatsappUrl={trip?.whatsapp_group_url ?? undefined}
        title={trip?.title}
        showMemberUpsell={isGuest}
      />
    )
  }

  return (
    <div className="text-center py-16">
      <p className="text-white/40">Booking not found for reference: {bookingRef}</p>
    </div>
  )
}
