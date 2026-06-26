import { getPublicClient } from '@/lib/supabase/public'
import { PartyRecapStrip } from './PartyRecapStrip'

const STATIC_VIDEOS = [
  { id: 'static-1', video_url: '/party-1.mp4', thumbnail_url: null, overlay_title: null, overlay_subtitle: null },
  { id: 'static-2', video_url: '/party-2.mp4', thumbnail_url: null, overlay_title: null, overlay_subtitle: null },
  { id: 'static-3', video_url: '/party-3.mp4', thumbnail_url: null, overlay_title: null, overlay_subtitle: null },
  { id: 'static-4', video_url: '/party-4.mp4', thumbnail_url: null, overlay_title: null, overlay_subtitle: null },
]

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
      return STATIC_VIDEOS
    }
    return data && data.length > 0 ? data : STATIC_VIDEOS
  } catch (err) {
    console.error('[PartyRecapSection] unexpected:', err)
    return STATIC_VIDEOS
  }
}

export default async function PartyRecapSection() {
  const videos = await getRecapVideos()
  return <PartyRecapStrip videos={videos} city="Madrid" />
}
