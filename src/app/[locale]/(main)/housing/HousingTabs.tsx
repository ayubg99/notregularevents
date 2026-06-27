'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import PartnerRoomCard from '@/components/housing/PartnerRoomCard'
import HousingBoard from './HousingBoard'
import type { PartnerRoomRow, HousingListingRow } from '@/types/database'

const TABS = [
  { id: 'partner', label: '⭐ Verified Rooms',   description: 'Verified by Not Regular Events' },
  { id: 'student', label: '👥 Student Listings', description: 'Posted by students'        },
] as const

type TabId = typeof TABS[number]['id']

const NEIGHBORHOODS = [
  'Ruzafa', 'El Carmen', 'Benimaclet', 'Malvarrosa',
  'Campanar', 'Mestalla', 'Patraix', 'Algirós', 'Quatre Carreres', 'Gran Via', 'Extramurs',
]

const ROOM_TYPES = [
  { value: 'private_room',   label: 'Private Room'   },
  { value: 'shared_room',    label: 'Shared Room'    },
  { value: 'studio',         label: 'Studio'         },
  { value: 'full_apartment', label: 'Full Apartment' },
]

interface Props {
  partnerRooms:    PartnerRoomRow[]
  initialListings: HousingListingRow[]
  hasMembership:   boolean
  isLoggedIn:      boolean
}

export default function HousingTabs({ partnerRooms, initialListings, hasMembership, isLoggedIn }: Props) {
  const [activeTab,  setActiveTab]  = useState<TabId>('partner')
  const [hood,       setHood]       = useState('')
  const [maxPrice,   setMaxPrice]   = useState(2000)
  const [roomType,   setRoomType]   = useState('')

  const filtered = partnerRooms.filter(r =>
    (!hood     || r.neighborhood === hood) &&
    (!roomType || r.room_type    === roomType) &&
    (maxPrice >= 2000 || r.monthly_rent <= maxPrice),
  )

  return (
    <>
      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="flex gap-3 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-6 py-3.5 rounded-2xl text-left transition-all duration-200 border ${
              activeTab === tab.id
                ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25'
                : 'bg-transparent border-white/20 text-white/60 hover:border-white/40 hover:text-white/80'
            }`}
          >
            <p className={`font-semibold text-sm ${activeTab === tab.id ? 'text-white' : ''}`}>
              {tab.label}
            </p>
            <p className={`text-xs mt-0.5 ${activeTab === tab.id ? 'text-white/70' : 'text-white/40'}`}>
              {tab.description}
            </p>
          </button>
        ))}
      </div>

      {/* ── Partner rooms tab ─────────────────────────────────── */}
      {activeTab === 'partner' && (
        <div>
          {/* Filter bar */}
          <div className="glass-card rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Neighborhood</label>
              <select
                value={hood}
                onChange={e => setHood(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50"
              >
                <option value="">All areas</option>
                {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Max rent: {maxPrice >= 2000 ? 'Any' : `€${maxPrice}/mo`}
              </label>
              <input
                type="range"
                min={200}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-orange-500 mt-1"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Room type</label>
              <select
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50"
              >
                <option value="">All types</option>
                {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Rooms grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-white/40">
              <p className="text-lg font-medium text-white/60 mb-2">No verified rooms available right now</p>
              <p className="text-sm">Try adjusting your filters or check back soon</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(room => (
                <PartnerRoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Student listings tab ──────────────────────────────── */}
      {activeTab === 'student' && (
        <div>
          {/* Membership banner */}
          {!hasMembership && (
            <div className="flex items-center gap-4 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-4 mb-6">
              <span className="text-2xl flex-shrink-0">👑</span>
              <div className="flex-1">
                <p className="text-brand-accent font-semibold text-sm mb-0.5">Students see contact details</p>
                <p className="text-white/50 text-xs">
                  Join membership to see WhatsApp and email contacts.{' '}
                  <Link href="/membership" className="text-brand-accent hover:underline">
                    Join now →
                  </Link>
                </p>
              </div>
            </div>
          )}

          <HousingBoard initialListings={initialListings} isLoggedIn={isLoggedIn} />
        </div>
      )}

      {/* ── Floating FAB (mobile) ─────────────────────────────── */}
      <Link
        href={isLoggedIn ? '/housing/post?type=room_available' : '/auth/login?redirect=/housing/post?type=room_available'}
        className="md:hidden fixed bottom-6 right-5 z-50 btn-primary px-5 py-3 rounded-full font-semibold text-sm shadow-xl shadow-brand-primary/30"
      >
        + Post
      </Link>
    </>
  )
}
