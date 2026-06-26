import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, ReviewRow, EventCategory } from '@/types/database'

// cache() deduplicates calls within a single React render pass —
// generateMetadata and the page component can both call getEventBySlug
// without triggering two separate Supabase round-trips.

export const getEventBySlug = cache(async (slug: string): Promise<EventRow | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  return data ?? null
})

export async function getPublishedEvents(options?: {
  category?: EventCategory
  limit?: number
}): Promise<EventRow[]> {
  const supabase = await createClient()

  let q = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(options?.limit ?? 50)

  if (options?.category) {
    q = q.eq('category', options.category)
  }

  const { data, error } = await q
  if (error) {
    console.error('[getPublishedEvents]', error.message)
    return []
  }
  return data ?? []
}

export async function getEventReviews(eventId: string): Promise<ReviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('target_type', 'event')
    .eq('target_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getEventReviews]', error.message)
    return []
  }
  return data ?? []
}

