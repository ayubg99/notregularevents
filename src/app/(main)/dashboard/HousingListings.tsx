'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { HousingListingRow } from '@/types/database'

interface Props {
  myListings: HousingListingRow[]
}

export default function HousingListings({ myListings }: Props) {
  const [listings, setListings] = useState<HousingListingRow[]>(myListings)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleDeleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return
    const supabase = createClient()
    const { error } = await supabase.from('housing_listings').delete().eq('id', id)
    if (error) { setToast('Error: ' + error.message); return }
    setListings(prev => prev.filter(l => l.id !== id))
    setToast('Listing deleted')
  }

  async function handleMarkRented(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('housing_listings')
      .update({ status: 'rented' })
      .eq('id', id)
    if (error) { setToast('Error: ' + error.message); return }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rented' } : l))
    setToast('Marked as rented')
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-bold text-white">🏠 My Housing Listings</h2>
        <Link
          href="/housing/post"
          className="px-4 py-1.5 rounded-full bg-brand-accent text-brand-dark text-xs font-bold hover:brightness-110 transition-all"
        >
          + Post a Room
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-white/30 text-sm mb-4">No listings yet</p>
          <Link
            href="/housing/post"
            className="inline-block bg-brand-accent text-brand-dark px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all"
          >
            + Post a Room
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map(listing => (
            <div
              key={listing.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    listing.type === 'room_available'
                      ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {listing.type === 'room_available' ? '🏠 Room Available' : '👤 Looking for Room'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${
                    listing.status === 'active'
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : listing.status === 'rented'
                      ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                  }`}>
                    ● {listing.status}
                  </span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {listing.neighborhood && `📍 ${listing.neighborhood}`}
                  {listing.price && ` • €${listing.price}/mo`}
                  {listing.expires_at && ` • Expires ${new Date(listing.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Link
                  href={`/housing/edit/${listing.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs transition-colors text-center"
                >
                  ✏️ Edit
                </Link>
                {listing.status === 'active' && (
                  <button
                    onClick={() => handleMarkRented(listing.id)}
                    className="px-3 py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs transition-colors"
                  >
                    ✅ Rented
                  </button>
                )}
                <button
                  onClick={() => handleDeleteListing(listing.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}

          <Link
            href="/housing/post"
            className="block text-center py-3 rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent font-semibold text-sm hover:bg-brand-accent/20 transition-colors"
          >
            + Post Another Listing
          </Link>
        </div>
      )}

      {toast && (
        <div className={`mt-4 text-center text-sm rounded-xl py-2 border ${
          toast.startsWith('Error')
            ? 'text-red-400 bg-red-500/10 border-red-500/20'
            : 'text-green-400 bg-green-500/10 border-green-500/20'
        }`}>
          {toast}
        </div>
      )}
    </div>
  )
}
