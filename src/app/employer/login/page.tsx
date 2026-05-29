'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock } from 'lucide-react'

function EmployerLoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/employer/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        return
      }
      if (data.user?.user_metadata?.role !== 'employer') {
        await supabase.auth.signOut()
        setError('This account is not an employer account. Visit /auth/login for student accounts.')
        return
      }
      router.push(redirectTo)
      router.refresh()
    })
  }

  return (
    <main className="flex items-center justify-center px-4 py-20 min-h-[calc(100vh-56px)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-3">💼 Employer Portal</p>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 text-sm">Sign in to manage your job listings</p>
        </div>

        <div className="glass-card rounded-2xl p-8 flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Company email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 flex flex-col gap-2">
          <p className="text-white/40 text-sm">
            No employer account?{' '}
            <Link href="/employer/register" className="text-brand-primary hover:brightness-110 transition-colors font-medium">
              Register your company
            </Link>
          </p>
          <p className="text-white/25 text-xs">
            Looking for a job?{' '}
            <Link href="/jobs" className="hover:text-white/50 transition-colors">
              Browse listings
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function EmployerLoginPage() {
  return (
    <Suspense>
      <EmployerLoginForm />
    </Suspense>
  )
}
