'use client'

import { useState } from'react'
import Link from'next/link'
import { useRouter } from'next/navigation'
import { createClient } from'@/lib/supabase/client'
import { Loader2, Mail, Lock, User, Phone, Globe, Building2 } from'lucide-react'

export default function EmployerRegisterPage() {
  const router = useRouter()

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) { setError('Company name is required.'); return }
    if (!contactName.trim()) { setError('Contact name is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()

      // 1. Create auth account with employer role
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role:'employer',
            company_name: companyName.trim(),
            contact_name: contactName.trim(),
          },
        },
      })

      if (signUpError) { setError(signUpError.message); return }

      if (signUpData.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in.')
        return
      }

      if (!signUpData.user) { setError('Registration failed. Please try again.'); return }

      // 2. Create employer_accounts record via API
      const res = await fetch('/api/employer/create-account', {
        method:'POST',
        headers: {'Content-Type':'application/json' },
        body: JSON.stringify({
          user_id: signUpData.user.id,
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          website: website.trim() || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ??'Account creation failed.')
        return
      }

      if (signUpData.session) {
        router.push('/employer/dashboard')
      } else {
        router.push('/employer/login?message=check-email')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-56px)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-3"> Employer Portal</p>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Create Employer Account</h1>
          <p className="text-white/50 text-sm">Post jobs and reach international students in Valencia</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Company name */}
            <div className="relative">
              <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Company name *"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Contact name */}
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Your name (contact person) *"
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
                placeholder="Company email *"
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
                placeholder="Password (min 8 characters) *"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Phone (optional) */}
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {/* Website (optional) */}
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="Company website (optional)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> :'Create Employer Account →'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 flex flex-col gap-2">
          <p className="text-white/40 text-sm">
            Already have an account?{''}
            <Link href="/employer/login" className="text-brand-primary hover:brightness-110 transition-colors font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-white/25 text-xs">
            Looking for a job?{''}
            <Link href="/jobs" className="hover:text-white/50 transition-colors">
              Browse listings
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
