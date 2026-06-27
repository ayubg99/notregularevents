'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { submitAmbassadorApplication } from '@/app/actions/ambassador'

export default function ApplicationForm() {
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [university, setUniversity] = useState('')
  const [instagram,  setInstagram]  = useState('')
  const [whyJoin,    setWhyJoin]    = useState('')
  const [error,      setError]      = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [isPending,  startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitAmbassadorApplication({
        name,
        email,
        university,
        instagram: instagram || undefined,
        why_join:  whyJoin,
      })
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-3xl">
          🎉
        </div>
        <div>
          <p className="font-heading text-2xl font-bold text-white mb-2">Application received!</p>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            We&apos;ll review your application and be in touch at <span className="text-white/80">{email}</span> within 48 hours.
          </p>
        </div>
        <p className="text-white/30 text-xs">In the meantime, follow us on Instagram for updates.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <h3 className="font-heading text-xl font-bold text-white mb-6">Apply Now</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">University</label>
            <input
              type="text"
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="Your university"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Instagram handle <span className="text-white/25">(optional)</span></label>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1.5 block">
            Why do you want to become an ambassador?
          </label>
          <textarea
            value={whyJoin}
            onChange={e => setWhyJoin(e.target.value)}
            placeholder="Tell us about yourself, your network, and why you'd make a great Not Regular Events promoter…"
            required
            minLength={50}
            rows={5}
            className={`${inputClass} resize-none`}
          />
          <p className="text-white/20 text-xs mt-1">{whyJoin.length} / 50 min characters</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded font-bold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ background: '#F4D03F', color: '#0A0A0A' }}
        >
          {isPending
            ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
            : 'Submit Application'
          }
        </button>
      </form>
    </div>
  )
}
