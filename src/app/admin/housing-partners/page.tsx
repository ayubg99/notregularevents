import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import PartnersClient from './PartnersClient'
import type { HousingPartnerRow } from '@/types/database'

export const dynamic = 'force-dynamic'

type RawPartner = HousingPartnerRow & { partner_rooms: { count: number }[] | null }

export default async function HousingPartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/housing-partners')

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') redirect('/')

  const admin = getAdminClient()

  const { data: partners } = await admin
    .from('housing_partners')
    .select('*, partner_rooms(count)')
    .order('created_at', { ascending: false }) as { data: RawPartner[] | null }

  const partnersWithCount = (partners ?? []).map(p => ({
    ...p,
    room_count: p.partner_rooms?.[0]?.count ?? 0,
  }))

  return (
    <div>
      <PartnersClient partners={partnersWithCount} />
    </div>
  )
}
