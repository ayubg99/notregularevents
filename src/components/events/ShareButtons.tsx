'use client'

import { useState } from 'react'
import { Copy, CheckCircle, MessageCircle } from 'lucide-react'

interface Props {
  title: string
  slug:  string
}

export default function ShareButtons({ title, slug }: Props) {
  const [copied, setCopied] = useState(false)
  const [url] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : `https://notregularevents.com/${slug}`
  )

  const waText = encodeURIComponent(`Check out this event: ${title} — ${url}`)

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2_500)
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-white/50 text-sm mr-1">Share:</span>

      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-75"
        style={{ backgroundColor: '#25D366' }}
      >
        <MessageCircle size={14} />
        WhatsApp
      </a>

      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-[var(--border-clr)] text-[var(--text-muted)] hover:border-brand-primary/50 hover:text-[var(--text-base)] transition-all duration-200"
      >
        {copied
          ? <><CheckCircle size={14} className="text-brand-success" /> Copied!</>
          : <><Copy size={14} /> Copy Link</>}
      </button>
    </div>
  )
}
