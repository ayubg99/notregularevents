export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title:       'My Dashboard — Erasmus Vibe',
  description: 'Manage your bookings, membership, and profile on Erasmus Vibe Valencia.',
}
import ProfileForm from './ProfileForm'
import BookingTabs from './BookingTabs'
import HousingListings from './HousingListings'
import MemberCard from './MemberCard'
import type { EventTicketRow, TripBookingRow, ProfileRow, MembershipRow, UserRow, HousingListingRow, SponsorRow } from '@/types/database'

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
    { data: myListingsRaw },
    { data: sponsorsRaw },
  ] = await Promise.all([
    supabase.from('users').select('full_name, avatar_url, role').eq('id', user.id).single(),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('memberships').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('event_tickets').select('*, events(id, title, date, location, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('trip_bookings').select('*, trips(id, title, start_date, destination, slug, whatsapp_group_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('housing_listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('sponsors').select('*').eq('status', 'active').eq('members_only', true).order('display_order', { ascending: true }),
  ])

  const displayName = (userRow as Pick<UserRow, 'full_name'> | null)?.full_name ?? user.email?.split('@')[0] ?? 'Student'
  const initials    = getInitials(displayName)
  const avatarUrl   = (userRow as Pick<UserRow, 'full_name' | 'avatar_url'> | null)?.avatar_url

  const eventTickets = (eventTicketsRaw ?? []) as unknown as EventTicketWithEvent[]
  const tripBookings = (tripBookingsRaw ?? []) as unknown as TripBookingWithTrip[]
  const myListings   = (myListingsRaw ?? []) as HousingListingRow[]
  const sponsors     = (sponsorsRaw ?? []) as SponsorRow[]
  const activeMembership = membership as MembershipRow | null
  const profileData  = profile as ProfileRow | null

  const memberQrUrl = activeMembership
    ? await QRCode.toDataURL(
        `ERASMUSVIBE-${user.id.slice(0, 8).toUpperCase()}`,
        { width: 120, margin: 1 },
      )
    : null

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

          {/* Left — bookings + housing (wider) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <BookingTabs
              eventTickets={eventTickets}
              tripBookings={tripBookings}
            />
            <HousingListings myListings={myListings} />
          </div>

          {/* Right — membership + discounts + profile */}
          <div className="flex flex-col gap-6">

            {/* Member card or upgrade prompt */}
            {activeMembership ? (
              <MemberCard
                membership={activeMembership}
                displayName={displayName}
                nationality={profileData?.nationality ?? null}
                university={profileData?.university ?? null}
                qrCodeUrl={memberQrUrl}
              />
            ) : (
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
            )}

            {/* Member discounts */}
            {activeMembership && sponsors.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-bold text-sm">🎁 Your Member Discounts</h3>
                <div className="grid grid-cols-2 gap-3">
                  {sponsors.map(sponsor => (
                    <div
                      key={sponsor.id}
                      className="glass-card rounded-xl p-3 text-center flex flex-col items-center gap-2"
                    >
                      {/* Logo */}
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, height: 48, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sponsor.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sponsor.logo_url} alt={sponsor.name} style={{ maxHeight: 28, maxWidth: 80, objectFit: 'contain' }} />
                        ) : (
                          <span className="text-white font-bold text-xs text-center leading-tight">{sponsor.name}</span>
                        )}
                      </div>
                      {/* Discount badge */}
                      {sponsor.discount_text && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
                          {sponsor.discount_text}
                        </span>
                      )}
                      {/* Instructions */}
                      {sponsor.redemption_instructions && (
                        <p className="text-white/40 text-[10px] leading-snug">{sponsor.redemption_instructions}</p>
                      )}
                      {/* Code */}
                      {sponsor.discount_code && (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded" style={{ fontFamily: 'monospace', color: '#F5A623', background: 'rgba(255,255,255,0.05)' }}>
                          {sponsor.discount_code}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ProfileForm
              user={{ full_name: (userRow as Pick<UserRow, 'full_name'> | null)?.full_name ?? null }}
              profile={profileData}
            />
          </div>

        </div>
      </div>
    </main>
  )
}
