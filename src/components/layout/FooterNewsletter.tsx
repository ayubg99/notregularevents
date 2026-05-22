'use client'

import { ArrowRight, Mail } from 'lucide-react'

export default function FooterNewsletter() {
  return (
    <form
      className="flex w-full md:w-auto gap-2"
      onSubmit={(e) => e.preventDefault()}
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
        className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary hover:brightness-110 active:brightness-90 text-white text-sm font-semibold rounded-full transition-all duration-200 flex-shrink-0"
      >
        Subscribe
        <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    </form>
  )
}
