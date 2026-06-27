'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HousingListingRow, HousingType, HousingRoomType, HousingGenderPref } from '@/types/database'
import ListingCard from '@/components/housing/ListingCard'
import { Link } from '@/i18n/navigation'

const NEIGHBORHOODS = [
  'Ruzafa', 'El Carmen', 'Benimaclet', 'Malvarrosa',
  'Campanar', 'Mestalla', 'Patraix', 'Algirós', 'Quatre Carreres',
]

const ROOM_TYPES = [
  { value: 'private_room',   label: 'Private Room'   },
  { value: 'shared_room',    label: 'Shared Room'    },
  { value: 'studio',         label: 'Studio'         },
  { value: 'full_apartment', label: 'Full Apartment' },
]

const GENDER_PREFS = [
  { value: 'male',   label: 'Male only'   },
  { value: 'female', label: 'Female only' },
  { value: 'mixed',  label: 'Mixed'       },
]

interface Props {
  initialListings: HousingListingRow[]
  isLoggedIn:      boolean
}

export default function HousingBoard({ initialListings, isLoggedIn }: Props) {
  const [activeTab,    setActiveTab]    = useState<HousingType>('room_available')
  const [neighborhood, setNeighborhood] = useState('')
  const [maxPrice,     setMaxPrice]     = useState(1000)
  const [roomType,     setRoomType]     = useState('')
  const [genderPref,   setGenderPref]   = useState('')
  const [listings,     setListings]     = useState<HousingListingRow[]>(initialListings)

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    let cancelled = false
    const supabase = createClient()

    let query = supabase
      .from('housing_listings')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .eq('type', activeTab)
      .order('created_at', { ascending: false })

    if (neighborhood) query = query.eq('neighborhood', neighborhood)
    if (maxPrice < 1000) query = query.lte('price', maxPrice)
    if (roomType && activeTab === 'room_available') query = query.eq('room_type', roomType as HousingRoomType)
    if (genderPref) query = query.eq('gender_preference', genderPref as HousingGenderPref)

    query.then(({ data }) => {
      if (!cancelled) setListings(data ?? [])
    })

    return () => { cancelled = true }
  }, [activeTab, neighborhood, maxPrice, roomType, genderPref])

  return (
    <div>
      {/* Controls row: tab switcher left, post buttons right */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['room_available', 'looking_for_room'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setRoomType('') }}
              style={{
                padding: '10px 20px',
                borderRadius: '50px',
                border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === tab ? '#FF6B00' : 'transparent',
                color: activeTab === tab ? '#0D0D0D' : '#888',
                fontWeight: activeTab === tab ? 700 : 400,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {tab === 'room_available' ? '🏠 Rooms Available' : '👤 Looking for Room'}
            </button>
          ))}
        </div>

        {/* Post buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={isLoggedIn ? '/housing/post?type=room_available' : '/auth/login?redirect=/housing/post?type=room_available'}
            style={{
              padding: '10px 16px',
              borderRadius: '50px',
              background: '#FF6B00',
              color: '#0D0D0D',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Post a Room
          </a>
          <a
            href={isLoggedIn ? '/housing/post?type=looking_for_room' : '/auth/login?redirect=/housing/post?type=looking_for_room'}
            style={{
              padding: '10px 16px',
              borderRadius: '50px',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              fontWeight: 500,
              fontSize: '13px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Looking for Room
          </a>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Neighborhood</label>
          <select
            value={neighborhood}
            onChange={e => setNeighborhood(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50"
          >
            <option value="">All areas</option>
            {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Max price: {maxPrice === 1000 ? 'Any' : `€${maxPrice}/mo`}
          </label>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Room type</label>
          <select
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
            disabled={activeTab === 'looking_for_room'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50 disabled:opacity-40"
          >
            <option value="">All types</option>
            {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Gender pref.</label>
          <select
            value={genderPref}
            onChange={e => setGenderPref(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50"
          >
            <option value="">Any</option>
            {GENDER_PREFS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {listings.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg font-medium text-white/60 mb-2">No listings yet</p>
          <p className="text-sm mb-6">Be the first to post in this category</p>
          <Link
            href={`/housing/post?type=${activeTab}`}
            className="btn-primary px-6 py-3 rounded-full text-sm font-semibold"
          >
            Post a listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
