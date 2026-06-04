'use client'

import { useState, useTransition } from'react'
import { motion, AnimatePresence } from'framer-motion'
import { Mail, ArrowRight, CheckCircle } from'lucide-react'
import { subscribeToNewsletter } from'@/app/actions/newsletter'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' |'success' |'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeToNewsletter(email)
      if (result.success) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
        setErrorMessage(result.error ??'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <section className="py-20 bg-[var(--bg-base)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">

        <AnimatePresence mode="wait">
          {status ==='success' ? (

            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease:'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-brand-success/15 flex items-center justify-center">
                <CheckCircle size={32} className="text-brand-success" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-[var(--text-base)]">
                You&apos;re in! 
              </h3>
              <p className="text-[var(--text-muted)] max-w-sm">
                Thanks for subscribing. You&apos;ll be the first to know about upcoming events and trips.
              </p>
            </motion.div>

          ) : (

            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease:'easeOut' }}
            >
              <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
                Stay Updated
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-base)] mb-3">
                Never Miss a Vibe
              </h2>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                Event drops, trip alerts and exclusive member offers — straight to your inbox. No spam, ever.
              </p>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                    placeholder="your@email.com"
                    disabled={isPending}
                    className="
                      w-full pl-11 pr-4 py-3.5 rounded-full text-sm
                      border border-[var(--border-clr)] bg-[var(--bg-card)]
                      text-[var(--text-base)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:border-brand-primary/60
                      transition-all duration-200 disabled:opacity-50
"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm rounded-full shadow-brand-sm hover:shadow-brand-md transition-all duration-200 disabled:opacity-70 flex-shrink-0"
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Subscribe <ArrowRight size={14} strokeWidth={2.5} /></>
                  )}
                </button>
              </form>

              {status ==='error' && (
                <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
              )}
            </motion.div>

          )}
        </AnimatePresence>

      </div>
    </section>
  )
}
