import { getPublicClient } from '@/lib/supabase/public'
import type { EventRow } from '@/types/database'
import FeaturedEventsClient from './FeaturedEventsClient'

async function getPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(8)

    if (error) {
      console.error('[FeaturedEvents]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[FeaturedEvents] unexpected:', err)
    return []
  }
}

export default async function FeaturedEvents() {
  const events = await getPublishedEvents()
  return <FeaturedEventsClient events={events} />
}
