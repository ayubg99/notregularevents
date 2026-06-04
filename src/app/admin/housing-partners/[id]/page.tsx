import { redirect, notFound } from'next/navigation'
import Link from'next/link'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import PartnerDetailClient from'./PartnerDetailClient'
import type { HousingPartnerRow, PartnerRoomRow } from'@/types/database'

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/housing-partners')
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !=='admin') redirect('/')

  const admin = getAdminClient()

  const { data: partner } = await admin
    .from('housing_partners')
    .select('*')
    .eq('id', id)
    .single() as unknown as { data: HousingPartnerRow | null }

  if (!partner) notFound()

  const { data: rooms } = await admin
    .from('partner_rooms')
    .select('*')
    .eq('partner_id', id)
    .order('created_at', { ascending: false }) as unknown as { data: PartnerRoomRow[] | null }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/admin/housing-partners" className="hover:text-white transition-colors">Partners</Link>
        <span>/</span>
        <span className="text-white/60">{partner.name}</span>
      </div>
      <PartnerDetailClient partner={partner} rooms={rooms ?? []} />
    </div>
  )
}
