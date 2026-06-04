'use client'

import { useState, useEffect } from'react'
import Link from'next/link'
import { createClient } from'@/lib/supabase/client'
import type { HousingListingRow } from'@/types/database'

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
    if (error) { setToast('Error:' + error.message); return }
    setListings(prev => prev.filter(l => l.id !== id))
    setToast('Listing deleted')
  }

  async function handleMarkRented(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('housing_listings')
      .update({ status:'rented' })
      .eq('id', id)
    if (error) { setToast('Error:' + error.message); return }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status:'rented' } : l))
    setToast('Marked as rented')
  }

  return (
    <div className="glass-card rounded-2xl p-6">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 className="font-heading" style={{ color:'#fff', fontSize:'18px', fontWeight: 700, margin: 0 }}>
          My Housing Listings
        </h2>
        <Link
          href="/housing/post"
          style={{
            padding:'8px 16px',
            background:'#FF6B00',
            color:'#0D0D0D',
            borderRadius:'50px',
            textDecoration:'none',
            fontWeight: 700,
            fontSize:'13px',
          }}
        >
          + Post a Room
        </Link>
      </div>

      {/* Empty state */}
      {listings.length === 0 ? (
        <div style={{
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:'16px',
          padding:'40px 20px',
          textAlign:'center',
        }}>
          <p style={{ color:'#888', fontSize:'14px', margin:'0 0 20px' }}>No housing listings yet</p>
          <a
            href="/housing/post"
            style={{
              display:'inline-block',
              background:'#FF6B00',
              color:'#0D0D0D',
              padding:'10px 24px',
              borderRadius:'50px',
              textDecoration:'none',
              fontWeight: 700,
              fontSize:'14px',
            }}
          >
            + Post a Room
          </a>
        </div>
      ) : (
        <div>
          {listings.map(listing => (
            <div
              key={listing.id}
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'16px',
                padding:'20px',
                marginBottom:'12px',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>

                {/* Left content */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Top badges row */}
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'11px', fontWeight: 700, color:'#888', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                      {listing.type ==='room_available' ?'ROOM' :'LOOKING'}
                    </span>
                    <span style={{
                      background:
                        listing.status ==='active' ?'rgba(46,204,113,0.15)' :
                        listing.status ==='rented' ?'rgba(255,107,0,0.15)' :
'rgba(255,68,68,0.15)',
                      color:
                        listing.status ==='active' ?'#2ECC71' :
                        listing.status ==='rented' ?'#FF6B00' :
'#FF4444',
                      padding:'2px 10px',
                      borderRadius:'20px',
                      fontSize:'11px',
                      fontWeight: 700,
                    }}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Title */}
                  <p style={{ color:'#fff', fontWeight: 600, fontSize:'16px', margin:'0 0 8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {listing.title}
                  </p>

                  {/* Details row */}
                  <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                    {listing.neighborhood && (
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', color:'#888', fontSize:'13px' }}>
                         {listing.neighborhood}
                      </span>
                    )}
                    {listing.price && (
                      <span style={{ color:'#FF6B00', fontSize:'13px', fontWeight: 600 }}>
                        €{listing.price}/mo
                      </span>
                    )}
                    <span style={{ color:'#555', fontSize:'12px' }}>
                      Expires {new Date(listing.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    </span>
                  </div>

                </div>

                {/* Right: action buttons */}
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink: 0 }}>
                  <Link
                    href={`/housing/edit/${listing.id}`}
                    style={{
                      padding:'7px 14px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'20px',
                      color:'#ccc',
                      fontSize:'12px',
                      textDecoration:'none',
                      textAlign:'center',
                      fontWeight: 500,
                    }}
                  >
                    Edit
                  </Link>
                  {listing.status ==='active' && (
                    <button
                      onClick={() => handleMarkRented(listing.id)}
                      style={{
                        padding:'7px 14px',
                        background:'transparent',
                        border:'1px solid rgba(46,204,113,0.3)',
                        borderRadius:'20px',
                        color:'#2ECC71',
                        fontSize:'12px',
                        cursor:'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Mark Rented
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    style={{
                      padding:'7px 14px',
                      background:'transparent',
                      border:'1px solid rgba(255,68,68,0.2)',
                      borderRadius:'20px',
                      color:'#FF4444',
                      fontSize:'12px',
                      cursor:'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{
          marginTop:'16px',
          textAlign:'center',
          fontSize:'13px',
          padding:'10px',
          borderRadius:'10px',
          background: toast.startsWith('Error') ?'rgba(255,68,68,0.1)' :'rgba(46,204,113,0.1)',
          color: toast.startsWith('Error') ?'#FF4444' :'#2ECC71',
          border:`1px solid ${toast.startsWith('Error') ?'rgba(255,68,68,0.2)' :'rgba(46,204,113,0.2)'}`,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
