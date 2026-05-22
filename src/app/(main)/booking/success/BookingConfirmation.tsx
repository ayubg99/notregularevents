'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check, Download, MessageCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface Props {
  bookingRef:     string
  qrCode:         string | null
  icsContent?:    string
  whatsappUrl?:   string
  title?:         string
}

export default function BookingConfirmation({
  bookingRef,
  qrCode,
  icsContent,
  whatsappUrl,
  title = 'Your Booking',
}: Props) {
  const [copied, setCopied] = useState(false)

  function copyRef() {
    navigator.clipboard.writeText(bookingRef).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Success badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
          <Check size={28} className="text-green-400" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-white">Booking Confirmed!</h1>
        <p className="text-white/50 text-center max-w-xs">{title}</p>
      </div>

      {/* Booking ref */}
      <div className="glass-card rounded-2xl px-8 py-5 flex items-center gap-4">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Booking Reference</p>
          <p className="font-heading text-3xl font-bold text-white tracking-widest">{bookingRef}</p>
        </div>
        <button
          onClick={copyRef}
          className="p-2.5 rounded-xl border border-white/10 hover:border-brand-primary/50 transition-colors"
          title="Copy reference"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white/50" />}
        </button>
      </div>

      {/* QR code */}
      {qrCode && (
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3">
          <p className="text-white/40 text-xs uppercase tracking-widest">Show this at the door</p>
          <Image
            src={qrCode}
            alt={`QR code for booking ${bookingRef}`}
            width={192}
            height={192}
            className="rounded-xl"
            unoptimized
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {icsContent && (
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`}
            download={`booking-${bookingRef}.ics`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white/70 hover:border-brand-primary/50 hover:text-white text-sm font-medium transition-colors"
          >
            <Download size={14} />
            Add to Calendar
          </a>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors"
          >
            <MessageCircle size={14} />
            Join WhatsApp Group
          </a>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/30 text-sm font-medium transition-colors"
        >
          <LayoutDashboard size={14} />
          My Dashboard
        </Link>
      </div>
    </div>
  )
}
