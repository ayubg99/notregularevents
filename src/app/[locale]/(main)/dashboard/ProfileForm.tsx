'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/profile'
import type { ProfileRow, UserRow } from '@/types/database'
import { NATIONALITIES } from '@/lib/constants/nationalities'

interface Props {
  user:    Pick<UserRow, 'full_name'>
  profile: ProfileRow | null
}

export default function ProfileForm({ user, profile }: Props) {
  const [fullName,    setFullName]    = useState(user.full_name ?? '')
  const [bio,         setBio]         = useState(profile?.bio ?? '')
  const [nationality, setNationality] = useState(profile?.nationality ?? '')
  const [university,  setUniversity]  = useState(profile?.university ?? '')
  const [instagram,   setInstagram]   = useState(profile?.instagram ?? '')
  const [whatsapp,    setWhatsapp]    = useState(profile?.whatsapp ?? '')

  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError('')
    startTransition(async () => {
      const result = await updateProfile({ fullName, bio, nationality, university, instagram, whatsapp })
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save profile.')
      }
    })
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="font-heading text-lg font-bold text-white mb-5">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell us a little about yourself…"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Nationality</label>
            <select
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              className={`${inputClass} appearance-none [&>option]:bg-brand-dark`}
            >
              <option value="">Select…</option>
              {NATIONALITIES.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">University</label>
            <input
              type="text"
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="Your university"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@handle"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+34 600 000 000"
              className={inputClass}
            />
          </div>
        </div>

        {saved && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2.5 text-green-400 text-sm font-medium">
            Profile saved successfully
          </div>
        )}
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70"
        >
          {isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
