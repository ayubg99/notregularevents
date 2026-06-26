import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import HousingTabs from './HousingTabs'
import { PageHeader } from '@/components/shared/PageHeader'
import type { PartnerRoomRow } from '@/types/database'

export const metadata: Metadata = {
  title: 'Housing | Not Regular Events',
  description: 'Find rooms and flatmates in Madrid. Connect with other students and find your space.',
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

  const adminClient = getAdminClient()
  const { data: partnerRooms } = await adminClient
    .from('partner_rooms')
    .select('*, housing_partners(name, logo_url)')
    .eq('status', 'available')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false }) as unknown as { data: PartnerRoomRow[] | null }

  return (
    <main className="min-h-screen pt-20 pb-28">
      <PageHeader tag="Housing" title="Find Your Space" />

      <div className="container-marketing mt-10">
        {/* WhatsApp community card */}
        <div style={{
          background:    'var(--bg-card)',
          border:        '1px solid var(--border-subtle)',
          padding:       '32px',
          marginBottom:  '40px',
        }}>
          <p style={{ color: 'var(--accent-blue)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            WhatsApp Group
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, maxWidth: 600 }}>
            Haven&apos;t found a room in Madrid yet? Join this group! Here we share flat listings, available rooms and connect with other students looking together.
          </p>
          {/* TODO: replace '#' with actual WhatsApp group URL */}
          <a
            href="#"
            style={{ display: 'inline-block', background: 'var(--accent-blue)', color: '#fff', padding: '12px 24px', fontWeight: 700, fontSize: 13, textDecoration: 'none', borderRadius: 4 }}
          >
            Join WhatsApp Group →
          </a>
        </div>

        <HousingTabs
          partnerRooms={partnerRooms ?? []}
          initialListings={initialListings ?? []}
          hasMembership={hasMembership}
          isLoggedIn={!!user}
        />
      </div>
    </main>
  )
}
