'use client'

import { useState } from 'react'
import { ArrowRight, Mail, CheckCircle } from 'lucide-react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

export default function FooterNewsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await subscribeToNewsletter(email)
    setLoading(false)
    if (result.success) {
      setSuccess(true)
      setEmail('')
    } else {
      setError(result.error)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
        <CheckCircle size={16} />
        You&apos;re subscribed!
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <form
        className="flex w-full md:w-auto gap-2"
        onSubmit={handleSubmit}
      >
        <div className="relative flex-1 md:w-72">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
          <input
            type="email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5 rounded-full text-sm
              bg-white/8 border border-white/10
              text-white placeholder-white/30
              focus:outline-none focus:border-brand-primary/60 focus:bg-white/10
              transition-all duration-200
            "
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary hover:brightness-110 active:brightness-90 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-all duration-200 flex-shrink-0"
        >
          {loading ? 'Subscribing…' : 'Subscribe'}
          {!loading && <ArrowRight size={14} strokeWidth={2.5} />}
        </button>
      </form>
      {error && <p className="text-red-400 text-xs pl-3">{error}</p>}
    </div>
  )
}
