import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title:       'My Dashboard — Erasmus Vibe',
  description: 'Manage your bookings, membership, and profile on Erasmus Vibe Valencia.',
}
import ProfileForm from './ProfileForm'
import BookingTabs from './BookingTabs'
import type { EventTicketRow, TripBookingRow, ProfileRow, MembershipRow, UserRow } from '@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
}

type TripBookingWithTrip = TripBookingRow & {
  trips: { id: string; title: string; start_date: string; destination: string; slug: string; whatsapp_group_url: string | null } | null
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function MembershipCard({ membership }: { membership: MembershipRow | null }) {
  if (!membership) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-heading text-lg font-bold text-white mb-1">Membership</h2>
        <p className="text-white/40 text-sm mb-4">No active membership</p>
        <Link
          href="/membership"
          className="block w-full py-3 rounded-xl text-center bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200"
        >
          Upgrade Now
        </Link>
      </div>
    )
  }

  const planColors: Record<string, string> = {
    basic:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
    premium: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    vip:     'bg-amber-500/15 text-amber-300 border-amber-500/30',
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="font-heading text-lg font-bold text-white mb-4">Membership</h2>
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full border text-sm font-semibold capitalize ${planColors[membership.plan] ?? planColors.basic}`}
        >
          {membership.plan}
        </span>
        <span className="text-white/40 text-xs capitalize">{membership.status}</span>
      </div>
      {membership.end_date && (
        <p className="text-white/30 text-xs mt-3">
          Expires {new Date(membership.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [
    { data: userRow },
    { data: profile },
    { data: membership },
    { data: eventTicketsRaw },
    { data: tripBookingsRaw },
  ] = await Promise.all([
    supabase.from('users').select('full_name, avatar_url, role').eq('id', user.id).single(),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('memberships').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('event_tickets').select('*, events(id, title, date, location, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('trip_bookings').select('*, trips(id, title, start_date, destination, slug, whatsapp_group_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const displayName = (userRow as Pick<UserRow, 'full_name'> | null)?.full_name ?? user.email?.split('@')[0] ?? 'Student'
  const initials    = getInitials(displayName)
  const avatarUrl   = (userRow as Pick<UserRow, 'full_name' | 'avatar_url'> | null)?.avatar_url

  const eventTickets = (eventTicketsRaw ?? []) as unknown as EventTicketWithEvent[]
  const tripBookings = (tripBookingsRaw ?? []) as unknown as TripBookingWithTrip[]

  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Welcome header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-brand-primary/20 border border-brand-primary/40 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="56px" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-brand-primary text-lg">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">
              Hey, {displayName.split(' ')[0]}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — bookings (wider) */}
          <div className="lg:col-span-2">
            <BookingTabs
              eventTickets={eventTickets}
              tripBookings={tripBookings}
            />
          </div>

          {/* Right — membership + profile */}
          <div className="flex flex-col gap-6">
            <MembershipCard membership={membership as MembershipRow | null} />
            <ProfileForm
              user={{ full_name: (userRow as Pick<UserRow, 'full_name'> | null)?.full_name ?? null }}
              profile={profile as ProfileRow | null}
            />
          </div>

        </div>
      </div>
    </main>
  )
}
