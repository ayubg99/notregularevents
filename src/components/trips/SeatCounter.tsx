'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tripId:       string
  initialSeats: number
  capacity:     number
}

export default function SeatCounter({ tripId, initialSeats, capacity }: Props) {
  const [seatsSold, setSeatsSold] = useState(initialSeats)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`trip-seats-${tripId}`)
      .on(
        'postgres_changes' as const,
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new
          if (typeof updated.seats_sold === 'number') {
            setSeatsSold(updated.seats_sold)
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  const seatsLeft = capacity - seatsSold
  const soldPct   = (seatsSold / capacity) * 100

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wide">
          <Users size={13} />
          Availability
        </span>
        <span className={`text-xs font-semibold ${
          seatsLeft === 0
            ? 'text-red-400'
            : seatsLeft <= 5
            ? 'text-amber-400'
            : 'text-white/60'
        }`}>
          {seatsLeft === 0 ? 'Sold Out' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            soldPct >= 90 ? 'bg-red-500' : soldPct >= 60 ? 'bg-amber-500' : 'bg-brand-primary'
          }`}
          style={{ width: `${soldPct}%` }}
        />
      </div>
      <p className="text-white/30 text-xs mt-1.5 text-right">{seatsSold}/{capacity} booked</p>
    </div>
  )
}
