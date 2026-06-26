export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title:       'My Dashboard — Erasmus Life Valencia',
  description: 'Manage your bookings, membership, and Erasmus Life profile.',
}
import ProfileForm from './ProfileForm'
import BookingTabs from './BookingTabs'
import HousingListings from './HousingListings'
import MemberCard from './MemberCard'
import AmbassadorDashboard from './AmbassadorDashboard'
import type { EventTicketRow, ProfileRow, MembershipRow, UserRow, HousingListingRow, SponsorRow, AmbassadorRow, AmbassadorCommissionRow, AmbassadorRewardRow } from '@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
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
    { data: myListingsRaw },
    { data: sponsorsRaw },
    { data: ambassadorRaw },
  ] = await Promise.all([
    supabase.from('users').select('full_name, avatar_url, role').eq('id', user.id).single(),
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('memberships').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('event_tickets').select('*, events(id, title, date, location, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('housing_listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('sponsors').select('*').eq('status', 'active').eq('members_only', true).order('display_order', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('ambassadors').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ])

  const ambassador = ambassadorRaw as AmbassadorRow | null

  const [{ data: commissionsRaw }, { data: rewardsRaw }] = ambassador
    ? await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('ambassador_commissions').select('*').eq('ambassador_id', ambassador.id).order('created_at', { ascending: false }).limit(20),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('ambassador_rewards').select('*').eq('ambassador_id', ambassador.id).order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }]

  const commissions = (commissionsRaw ?? []) as AmbassadorCommissionRow[]
  const rewards     = (rewardsRaw     ?? []) as AmbassadorRewardRow[]

  const displayName = (userRow as Pick<UserRow, 'full_name'> | null)?.full_name ?? user.email?.split('@')[0] ?? 'Student'
  const initials    = getInitials(displayName)
  const avatarUrl   = (userRow as Pick<UserRow, 'full_name' | 'avatar_url'> | null)?.avatar_url

  const eventTickets = (eventTicketsRaw ?? []) as unknown as EventTicketWithEvent[]
  const myListings   = (myListingsRaw ?? []) as HousingListingRow[]
  const sponsors     = (sponsorsRaw  ?? []) as SponsorRow[]
  const activeMembership = membership as MembershipRow | null
  const profileData  = profile as ProfileRow | null

  const memberQrUrl = activeMembership
    ? await QRCode.toDataURL(
        `ERASMUSLIFE-${user.id.slice(0, 8).toUpperCase()}`,
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
            />
            <HousingListings myListings={myListings} />
            {ambassador && (
              <div className="glass-card rounded-2xl p-6">
                <AmbassadorDashboard
                  ambassador={ambassador}
                  commissions={commissions}
                  rewards={rewards}
                />
              </div>
            )}
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
                <h3 className="text-white font-bold text-sm">🎁 Your Student Discounts</h3>
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
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                          {sponsor.discount_text}
                        </span>
                      )}
                      {/* Instructions */}
                      {sponsor.redemption_instructions && (
                        <p className="text-white/40 text-[10px] leading-snug">{sponsor.redemption_instructions}</p>
                      )}
                      {/* Code — Semester/Annual only */}
                      {sponsor.discount_code && (
                        (activeMembership?.plan === 'premium' || activeMembership?.plan === 'vip') ? (
                          <span className="text-[12px] font-bold px-2 py-0.5 rounded" style={{ fontFamily: 'monospace', color: '#FF6B00', background: 'rgba(255,255,255,0.05)' }}>
                            {sponsor.discount_code}
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/25 px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            ⬆️ Semester+ only
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ambassador apply prompt — only for non-ambassadors */}
            {!ambassador && (
              <Link
                href="/ambassadors"
                className="relative rounded-2xl p-5 flex items-start gap-4 overflow-hidden transition-all duration-300 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(233,30,140,0.10) 0%, rgba(255,107,0,0.08) 100%)',
                  border: '1px solid rgba(233,30,140,0.25)',
                  boxShadow: '0 0 24px rgba(233,30,140,0.08)',
                }}
              >
                {/* subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.08) 0%, rgba(255,107,0,0.06) 100%)' }} />

                <div className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(233,30,140,0.25) 0%, rgba(255,107,0,0.20) 100%)',
                    border: '1px solid rgba(233,30,140,0.35)',
                  }}>
                  <span className="text-lg">🌟</span>
                </div>

                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-bold text-sm group-hover:text-brand-primary transition-colors">
                      Become an Ambassador
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(233,30,140,0.2)', color: '#E91E8C', border: '1px solid rgba(233,30,140,0.3)' }}>
                      NEW
                    </span>
                  </div>
                  <p className="text-white/55 text-xs leading-relaxed">
                    Earn 5% commission sharing Erasmus Life with friends. Free tickets, cash bonuses and more.
                  </p>
                  <p className="text-brand-primary text-xs font-bold mt-2 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Apply now <span>→</span>
                  </p>
                </div>
              </Link>
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
