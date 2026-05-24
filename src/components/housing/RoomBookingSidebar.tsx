'use client'

import { useState } from 'react'
import BookRoomModal from './BookRoomModal'
import type { PartnerRoomRow } from '@/types/database'

export default function RoomBookingSidebar({ room }: { room: PartnerRoomRow }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-amber-400 text-sm">⭐</span>
          <span className="text-white/70 text-sm font-medium">Verified Partner Room</span>
        </div>

        {/* Rent */}
        <p className="text-3xl font-bold text-white mb-1">
          €{room.monthly_rent}<span className="text-base font-normal text-white/50">/month</span>
        </p>

        {/* Breakdown */}
        <div className="space-y-2 mt-4 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Monthly rent</span>
            <span className="text-white">€{room.monthly_rent}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Deposit</span>
            <span className="text-white">€{room.deposit_amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Bills</span>
            <span className={room.bills_included ? 'text-green-400' : 'text-white/60'}>
              {room.bills_included ? 'Included' : '+ extra'}
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/50">Platform fee</span>
            <span className="text-brand-accent font-semibold">€{room.platform_fee}</span>
          </div>
          <p className="text-white/35 text-xs">Reservation fee — refunded if rejected</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-sm mb-4"
        >
          Reserve Room — €{room.platform_fee}
        </button>

        {/* Trust badges */}
        <div className="space-y-1.5">
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="text-green-400">✅</span> Verified by Erasmus Vibe
          </p>
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="text-green-400">✅</span> Full refund if not confirmed
          </p>
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="text-green-400">✅</span> Secure Stripe payment
          </p>
        </div>
      </div>

      <BookRoomModal room={room} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
