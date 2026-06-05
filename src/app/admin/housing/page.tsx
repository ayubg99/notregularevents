import { getAdminClient } from '@/lib/supabase/admin'
import HousingClient from './HousingClient'

export const dynamic = 'force-dynamic'

export default async function AdminHousingPage() {
  const admin = getAdminClient()
  const { data: listings } = await admin
    .from('housing_listings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Housing Listings</h1>
      <HousingClient listings={listings ?? []} />
    </div>
  )
}
