'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock } from 'lucide-react'

function LoginForm() {
  const t          = useTranslations('auth')
  const router     = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <main className="container-clean min-h-screen bg-brand-dark flex items-center justify-center py-20 pt-32 md:pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nre-logo.png" alt="Not Regular Events" className="h-12 w-auto" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">{t('welcomeBack')}</h1>
          <p className="text-white/50 text-sm">{t('loginSubtitle')}</p>
        </div>

        <div className="glass-card rounded-2xl p-8 flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('email')}
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
                placeholder={t('password')}
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
              {isPending ? <><Loader2 size={15} className="animate-spin" /> {t('signIn')}…</> : t('signIn')}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          {t('noAccount')}{' '}
          <Link href="/auth/register" className="text-brand-primary hover:brightness-110 transition-colors font-medium">
            {t('createOne')}
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
