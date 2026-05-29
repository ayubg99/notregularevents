import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import SponsorsClient from './SponsorsClient'
import type { SponsorRow } from '@/types/database'

export default async function AdminSponsorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/sponsors')

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') redirect('/')

  const admin = getAdminClient()
  const { data } = await admin
    .from('sponsors')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div>
      <SponsorsClient sponsors={(data ?? []) as SponsorRow[]} />
    </div>
  )
}
