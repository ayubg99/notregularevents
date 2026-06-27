'use client'

import { useState, useTransition } from 'react'
import { Loader2, Send } from 'lucide-react'
import { submitContact } from '@/app/actions/contact'

const SUBJECTS = [
  'General enquiry',
  'Event question',
  'Trip question',
  'Partnership',
  'Press & media',
  'Other',
]

export default function ContactForm() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitContact({ name, email, subject, message })
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

  if (sent) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-2xl">
          ✓
        </div>
        <div>
          <p className="font-heading text-xl font-bold text-white mb-1">Message sent!</p>
          <p className="text-white/50 text-sm">We&apos;ll reply to {email} within 24 hours.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Email address</label>
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

        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Subject</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            className={`${inputClass} appearance-none [&>option]:bg-brand-dark`}
          >
            <option value="" disabled>Select a subject…</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind…"
            required
            minLength={20}
            rows={5}
            className={`${inputClass} resize-none`}
          />
          <p className="text-white/20 text-xs mt-1">{message.length} / 20 min characters</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isPending
            ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
            : <><Send size={15} /> Send Message</>
          }
        </button>
      </form>
    </div>
  )
}
