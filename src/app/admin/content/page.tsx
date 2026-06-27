'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Link as LinkIcon, Video, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { saveSiteSetting } from '@/app/actions/admin'

interface WhatsappGroup {
  name: string
  url:  string
}

const inputClass  = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
const labelClass  = 'text-white/50 text-xs mb-1.5 block'
const sectionHead = 'text-white font-bold text-base mb-1'
const sectionSub  = 'text-white/40 text-xs mb-5'

function SectionCard({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className={sectionHead}>{title}</p>
          <p className={sectionSub}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function AdminContentPage() {
  const [heroVideo,  setHeroVideo]  = useState('')
  const [groups,     setGroups]     = useState<WhatsappGroup[]>([{ name: '', url: '' }])
  const [aboutMain,  setAboutMain]  = useState('')
  const [aboutGrid,  setAboutGrid]  = useState<string[]>(['', '', '', '', '', ''])
  const [toast,      setToast]      = useState('')
  const [saving,     setSaving]     = useState<string | null>(null)

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

  function setGroup(i: number, field: keyof WhatsappGroup, val: string) {
    setGroups(g => g.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  function addGroup() {
    setGroups(g => [...g, { name: '', url: '' }])
  }

  function removeGroup(i: number) {
    setGroups(g => g.filter((_, idx) => idx !== i))
  }

  function setPhoto(i: number, val: string) {
    setAboutGrid(p => p.map((url, idx) => idx === i ? val : url))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Website Content</h1>
        <p className="text-white/40 text-sm mt-1">Manage media and links shown across the site</p>
      </div>

      <div className="space-y-6">

        {/* Hero Video */}
        <SectionCard icon={<Video size={16} />} title="Hero Video" sub="Background video on the homepage hero section">
          <label className={labelClass}>Video URL or path (e.g. /hero.mp4 or https://...)</label>
          <div className="flex gap-3">
            <input
              className={inputClass}
              placeholder="/party-1.mp4"
              value={heroVideo}
              onChange={e => setHeroVideo(e.target.value)}
            />
            <button
              onClick={() => save('hero_video_url', heroVideo, 'Hero video')}
              disabled={saving === 'hero_video_url'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
            >
              <Save size={14} />
              Save
            </button>
          </div>
          {heroVideo && (
            <video
              src={heroVideo}
              muted
              loop
              autoPlay
              playsInline
              className="mt-4 w-full max-h-48 object-cover rounded-xl border border-white/10"
            />
          )}
        </SectionCard>

        {/* WhatsApp Groups */}
        <SectionCard icon={<MessageCircle size={16} />} title="Community WhatsApp Groups" sub="Groups shown on the community / events pages">
          <div className="space-y-3 mb-4">
            {groups.map((g, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    {i === 0 && <label className={labelClass}>Group name</label>}
                    <input
                      className={inputClass}
                      placeholder="Valencia Erasmus 🇪🇸"
                      value={g.name}
                      onChange={e => setGroup(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    {i === 0 && <label className={labelClass}>WhatsApp invite link</label>}
                    <input
                      className={inputClass}
                      placeholder="https://chat.whatsapp.com/..."
                      value={g.url}
                      onChange={e => setGroup(i, 'url', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeGroup(i)}
                  className={`w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 flex items-center justify-center transition-colors flex-shrink-0 ${i === 0 ? 'mt-5' : ''}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={addGroup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
            >
              <Plus size={14} />
              Add group
            </button>
            <button
              onClick={() => save('whatsapp_groups', groups.filter(g => g.name && g.url), 'WhatsApp groups')}
              disabled={saving === 'whatsapp_groups'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={14} />
              Save all
            </button>
          </div>
        </SectionCard>

        {/* About — main photo */}
        <SectionCard icon={<ImageIcon size={16} />} title="About Page — Main Photo" sub="Large hero photo at the top of the About page">
          <label className={labelClass}>Photo URL</label>
          <div className="flex gap-3">
            <input
              className={inputClass}
              placeholder="https://... or /about-hero.jpg"
              value={aboutMain}
              onChange={e => setAboutMain(e.target.value)}
            />
            <button
              onClick={() => save('about_main_photo', aboutMain, 'About main photo')}
              disabled={saving === 'about_main_photo'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
            >
              <Save size={14} />
              Save
            </button>
          </div>
          {aboutMain && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={aboutMain} alt="About main" className="mt-4 w-full max-h-48 object-cover rounded-xl border border-white/10" />
          )}
        </SectionCard>

        {/* About — community grid photos */}
        <SectionCard icon={<LinkIcon size={16} />} title="About Page — Community Photos" sub="6-photo grid in the community section of the About page">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {aboutGrid.map((url, i) => (
              <div key={i}>
                <label className={labelClass}>Photo {i + 1}</label>
                <input
                  className={inputClass}
                  placeholder="https://... or /community-1.jpg"
                  value={url}
                  onChange={e => setPhoto(i, e.target.value)}
                />
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Community ${i + 1}`} className="mt-2 w-full aspect-square object-cover rounded-xl border border-white/10" />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => save('about_community_photos', aboutGrid.filter(Boolean), 'Community photos')}
            disabled={saving === 'about_community_photos'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={14} />
            Save all photos
          </button>
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
