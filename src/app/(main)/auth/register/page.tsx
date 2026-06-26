'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, User, Globe, GraduationCap } from 'lucide-react'
import { NATIONALITIES } from '@/lib/constants/nationalities'
import { saveRegistrationProfile } from '@/app/actions/profile'

function RegisterForm() {
  const router = useRouter()

  const [fullName,    setFullName]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [nationality, setNationality] = useState('')
  const [university,  setUniversity]  = useState('')
  const [agreed,      setAgreed]    = useState(false)
  const [error,       setError]     = useState('')
  const [isLoading,   setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Please accept the terms to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!nationality) { setError('Please select your nationality.'); return }

    setError('')
    setIsLoading(true)

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, nationality, university },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    if (signUpData.user?.identities?.length === 0) {
      setError('An account with this email already exists. Please sign in.')
      setIsLoading(false)
      return
    }

    // Fire and forget — don't block the redirect on this round-trip
    if (signUpData.user && (nationality || university)) {
      saveRegistrationProfile(signUpData.user.id, { nationality, university })
    }

    if (signUpData.session) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login?message=check-email')
    }
  }

  return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center px-4 py-20 pt-28 md:pt-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nre-logo.jpeg" alt="Not Regular Events" className="h-12 w-auto" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Join Erasmus Life Valencia</h1>
          <p className="text-white/50 text-sm">Create your free account and join the Erasmus community</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full name */}
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (min. 8 characters)"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Nationality */}
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <select
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none [&>option]:bg-brand-dark"
              >
                <option value="" disabled>Select your nationality</option>
                {NATIONALITIES.map(n => (
                  <option key={n.value} value={n.value} style={{ background: '#0D0D0D' }}>{n.label}</option>
                ))}
              </select>
            </div>

            {/* University */}
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="University (optional)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border transition-all duration-150 flex items-center justify-center ${
                  agreed ? 'bg-brand-primary border-brand-primary' : 'border-white/20 bg-white/5 group-hover:border-white/40'
                }`}>
                  {agreed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-white/50 text-xs leading-relaxed">
                I agree to the{' '}
                <span className="text-brand-primary">Terms of Service</span>
                {' '}and{' '}
                <span className="text-brand-primary">Privacy Policy</span>
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-1 rounded-xl bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-primary hover:brightness-110 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
