import { getPublicClient } from '@/lib/supabase/public'
import { PartyRecapStrip } from './PartyRecapStrip'

async function getRecapVideos() {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('party_recap_media')
      .select('id, video_url, thumbnail_url, overlay_title, overlay_subtitle')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(8)

    if (error) {
      console.error('[PartyRecapSection]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[PartyRecapSection] unexpected:', err)
    return []
  }
}

export default async function PartyRecapSection() {
  const videos = await getRecapVideos()
  return <PartyRecapStrip videos={videos} city="Valencia" />
}
