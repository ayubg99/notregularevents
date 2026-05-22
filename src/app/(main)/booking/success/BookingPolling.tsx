'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import BookingConfirmation from './BookingConfirmation'

interface Booking {
  booking_ref: string
  qr_code:     string | null
  status:      string
}

interface Props {
  sessionId: string
}

export default function BookingPolling({ sessionId }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (booking || attempts >= 10) return

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/stripe/booking-status?session_id=${encodeURIComponent(sessionId)}`)
        const json = await res.json()
        if (json.found) {
          setBooking(json.booking)
          clearInterval(id)
        } else {
          setAttempts(a => a + 1)
        }
      } catch {
        setAttempts(a => a + 1)
      }
    }, 3000)

    return () => clearInterval(id)
  }, [sessionId, booking, attempts])

  if (booking) {
    return (
      <BookingConfirmation
        bookingRef={booking.booking_ref}
        qrCode={booking.qr_code}
      />
    )
  }

  if (attempts >= 10) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 text-lg mb-2">Payment received!</p>
        <p className="text-white/40 text-sm">
          Your booking is being processed. Check your notifications or email shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-16 flex flex-col items-center gap-4">
      <Loader2 size={36} className="text-brand-primary animate-spin" />
      <p className="text-white/70 text-lg font-medium">Processing your booking…</p>
      <p className="text-white/40 text-sm">This usually takes just a moment.</p>
    </div>
  )
}
