import { getAdminClient } from'@/lib/supabase/admin'
import TripsManager from'./TripsManager'

export default async function AdminTripsPage() {
  const admin = getAdminClient()
  const { data: trips } = await admin
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false })

  return <TripsManager initialTrips={trips ?? []} />
}
