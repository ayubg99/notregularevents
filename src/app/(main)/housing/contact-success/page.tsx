import { redirect } from 'next/navigation'
import Link from 'next/link'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function ContactSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId) redirect('/housing')

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    redirect('/housing')
  }

  const meta = session.metadata ?? {}
  const { room_title, neighborhood, booking_ref } = meta

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-lg mx-auto">

        {/* Pending banner */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-orange-400/20 flex items-center justify-center mx-auto mb-4 text-3xl">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Booking Pending!</h1>
          <p className="text-white/50">{room_title}{neighborhood ? ` · ${neighborhood}` : ''}</p>
        </div>

        {/* Payment confirmed */}
        <div className="glass-card rounded-2xl p-5 mb-4 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 text-base">
            ✅
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-0.5">Payment of €50 confirmed</p>
            <p className="text-white/50 text-sm">Your reservation fee has been received. The room is now held for you.</p>
          </div>
        </div>

        {/* What happens next */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <p className="text-white font-semibold mb-4">📋 What happens next?</p>
          <ol className="space-y-4">
            {[
              { icon: '📧', text: 'The landlord has been notified and will confirm your booking within 48 hours.' },
              { icon: '✅', text: 'If confirmed, you\'ll receive the landlord\'s full contact details by email.' },
              { icon: '📅', text: 'Contact the landlord to schedule a viewing and finalise move-in details.' },
              { icon: '📝', text: 'Sign the rental contract and pay rent + deposit directly to the landlord.' },
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-white/10 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-white/60">
                  {i + 1}
                </span>
                <span className="text-white/60">
                  <span className="mr-1">{step.icon}</span>
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Guarantee card */}
        <div className="rounded-2xl p-5 mb-4 border border-green-400/20 bg-green-400/5">
          <p className="text-green-400 font-semibold text-sm mb-1">🛡️ Money-back guarantee</p>
          <p className="text-white/60 text-sm">
            If the landlord doesn&apos;t confirm within 48 hours — or rejects your booking — you get a
            full automatic refund of €50. No questions asked.
          </p>
        </div>

        {/* Membership upsell */}
        <div className="rounded-2xl p-5 mb-4 border border-brand-accent/20 bg-brand-accent/5">
          <p className="text-brand-accent font-bold text-base mb-1">🎉 Welcome to Not Regular Events!</p>
          <p className="text-white/60 text-sm mb-4">
            Join our membership for €9.99/month and save 10% on all events and trips.
          </p>
          <Link
            href="/membership"
            className="btn-primary inline-block py-2.5 px-5 rounded-xl font-semibold text-sm"
          >
            Join Membership →
          </Link>
        </div>

        {/* Booking ref */}
        <div className="glass-card rounded-2xl p-4 text-center mb-6">
          {booking_ref && (
            <p className="text-white/30 text-xs mb-1 font-mono">Ref: {booking_ref}</p>
          )}
          <p className="text-white/40 text-xs">Check your email for full booking details</p>
        </div>

        <div className="text-center">
          <Link href="/housing" className="text-white/40 hover:text-white text-sm transition-colors">
            ← Browse more rooms
          </Link>
        </div>
      </div>
    </main>
  )
}
