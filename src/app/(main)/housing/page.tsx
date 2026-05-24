import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HousingBoard from './HousingBoard'

export const metadata: Metadata = {
  title: 'Housing Board | Erasmus Vibe',
  description: 'Find rooms and roommates in Valencia with fellow Erasmus students.',
}

export default async function HousingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasMembership = false
  if (user) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('status, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    hasMembership =
      !!membership &&
      (membership.end_date === null || new Date(membership.end_date) > new Date())
  }

  const { data: initialListings } = await supabase
    .from('housing_listings')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .eq('type', 'room_available')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your Home in Valencia 🏠
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Connect with other students for rooms and roommates
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/housing/post?type=room_available"
              className="btn-primary px-6 py-3 rounded-full font-semibold text-sm"
            >
              + Post a Room
            </Link>
            <Link
              href="/housing/post?type=looking_for_room"
              className="bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
            >
              + Looking for Room
            </Link>
          </div>
        </div>

        {/* Members-only banner */}
        <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-8">
          <span className="text-2xl flex-shrink-0">👑</span>
          <div>
            <p className="text-yellow-400 font-semibold text-sm mb-0.5">Members see contact details</p>
            <p className="text-white/50 text-xs">
              Join membership for €9.99/month to see WhatsApp and email contacts.{' '}
              <Link href="/membership" className="text-yellow-400 hover:underline">
                Join now →
              </Link>
            </p>
          </div>
        </div>

        {/* Board */}
        <HousingBoard
          initialListings={initialListings ?? []}
          hasMembership={hasMembership}
        />
      </div>
    </main>
  )
}
