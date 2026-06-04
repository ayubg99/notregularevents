import { getAdminClient } from'@/lib/supabase/admin'
import EventsManager from'./EventsManager'

export default async function AdminEventsPage() {
  const admin = getAdminClient()
  const { data: events } = await admin
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  return <EventsManager initialEvents={events ?? []} />
}
