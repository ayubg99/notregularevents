import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
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
  const t        = await getTranslations('housing')
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
    hasMembership = !!membership && (membership.end_date === null || new Date(membership.end_date) > new Date())
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
      <PageHeader tag={t('pageTag')} title={t('pageTitle')} />

      <div className="container-marketing mt-10">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '32px', marginTop: '24px', marginBottom: '40px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600 }}>
            {t('noRoomDesc')}
          </p>
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
