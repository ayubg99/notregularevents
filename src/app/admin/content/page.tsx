'use client'

import { useState, useEffect } from 'react'
import { Save, Video, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { saveSiteSetting } from '@/app/actions/admin'
import VideoUpload from '@/components/admin/VideoUpload'
import ImageUpload from '@/components/admin/ImageUpload'
import { createClient } from '@/lib/supabase/client'

const labelClass = 'text-white/50 text-xs mb-1.5 block'
const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

function SectionCard({ icon, title, sub, children }: {
  icon:     React.ReactNode
  title:    string
  sub:      string
  children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-white font-bold text-base">{title}</p>
          <p className="text-white/40 text-xs">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      <Save size={14} />
      {saving ? 'Saving…' : 'Save'}
    </button>
  )
}

const WHATSAPP_GROUPS = [
  { key: 'wg_student',  icon: '💬', label: 'Student Community group' },
  { key: 'wg_party',   icon: '🎉', label: 'Party group'             },
  { key: 'wg_housing', icon: '🏠', label: 'Housing group'           },
] as const

export default function AdminContentPage() {
  const [heroVideo,   setHeroVideo]   = useState('')
  const [aboutMain,   setAboutMain]   = useState('')
  const [aboutPhotos, setAboutPhotos] = useState(['', '', '', '', '', ''])
  const [wgUrls,      setWgUrls]      = useState<Record<string, string>>({
    wg_student: '', wg_party: '', wg_housing: '',
  })
  const [saving,  setSaving]  = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (createClient() as any)
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero_video_url', 'whatsapp_groups', 'about_main_photo', 'about_community_photos'])
      for (const row of (data ?? [])) {
        if (row.key === 'hero_video_url' && typeof row.value === 'string') setHeroVideo(row.value)
        if (row.key === 'about_main_photo' && typeof row.value === 'string') setAboutMain(row.value)
        if (row.key === 'about_community_photos' && Array.isArray(row.value)) {
          const photos = row.value as string[]
          setAboutPhotos(arr => arr.map((v, i) => photos[i] ?? v))
        }
        if (row.key === 'whatsapp_groups' && typeof row.value === 'object' && row.value !== null) {
          setWgUrls(row.value as Record<string, string>)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function save(key: string, value: unknown, label: string) {
    setSaving(key)
    const res = await saveSiteSetting(key, value)
    setSaving(null)
    showToast(res.success ? `${label} saved` : (res.error ?? 'Error saving'))
  }

  function setPhoto(i: number, url: string) {
    setAboutPhotos(p => p.map((v, idx) => idx === i ? url : v))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Website Content</h1>
        <p className="text-white/40 text-sm mt-1">Upload media and update links shown across the site</p>
      </div>

      <div className="space-y-6">

        {/* ── Hero Video ──────────────────────────────────────────── */}
        <SectionCard icon={<Video size={16} />} title="Hero Video" sub="Background video on the homepage hero section">
          <VideoUpload value={heroVideo} onChange={setHeroVideo} />
          {heroVideo && (
            <div className="mt-4 flex justify-end">
              <SaveBtn onClick={() => save('hero_video_url', heroVideo, 'Hero video')} saving={saving === 'hero_video_url'} />
            </div>
          )}
        </SectionCard>

        {/* ── WhatsApp Groups ─────────────────────────────────────── */}
        <SectionCard icon={<MessageCircle size={16} />} title="Community WhatsApp Groups" sub="Invite links on the Community page — 3 fixed groups">
          <div className="space-y-4">
            {WHATSAPP_GROUPS.map(({ key, icon, label }) => (
              <div key={key}>
                <label className={labelClass}>
                  {icon} {label}
                </label>
                <input
                  className={inputClass}
                  placeholder="https://chat.whatsapp.com/..."
                  value={wgUrls[key]}
                  onChange={e => setWgUrls(u => ({ ...u, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <SaveBtn
              onClick={() => save('whatsapp_groups', wgUrls, 'WhatsApp links')}
              saving={saving === 'whatsapp_groups'}
            />
          </div>
        </SectionCard>

        {/* ── About — main photo ──────────────────────────────────── */}
        <SectionCard icon={<ImageIcon size={16} />} title="About Page — Main Photo" sub="Large hero photo at the top of the About page">
          <ImageUpload value={aboutMain} onChange={setAboutMain} folder="content" />
          {aboutMain && (
            <div className="mt-4 flex justify-end">
              <SaveBtn onClick={() => save('about_main_photo', aboutMain, 'Main photo')} saving={saving === 'about_main_photo'} />
            </div>
          )}
        </SectionCard>

        {/* ── About — community grid (6 photos) ───────────────────── */}
        <SectionCard icon={<ImageIcon size={16} />} title="About Page — Community Photos" sub="6-photo grid in the community section of the About page">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {aboutPhotos.map((url, i) => (
              <div key={i}>
                <label className={labelClass}>Photo {i + 1}</label>
                <ImageUpload value={url} onChange={v => setPhoto(i, v)} folder="content" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <SaveBtn
              onClick={() => save('about_community_photos', aboutPhotos.filter(Boolean), 'Community photos')}
              saving={saving === 'about_community_photos'}
            />
          </div>
        </SectionCard>

      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark border border-white/10 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
