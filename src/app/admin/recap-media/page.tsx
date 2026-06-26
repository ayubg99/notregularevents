import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import RecapMediaClient from './RecapMediaClient'
import type { PartyRecapMediaRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminRecapMediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/recap-media')

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') redirect('/')

  const admin = getAdminClient()
  const { data } = await admin
    .from('party_recap_media')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <RecapMediaClient items={(data ?? []) as PartyRecapMediaRow[]} />
    </div>
  )
}
