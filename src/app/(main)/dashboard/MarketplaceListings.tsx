'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/marketplace'
import type { MarketplaceListingRow, MarketplaceStatus } from '@/types/database'

interface Props {
  myItems: MarketplaceListingRow[]
}

const STATUS_COLORS: Record<MarketplaceStatus, { bg: string; color: string }> = {
  active:   { bg: 'rgba(46,204,113,0.15)',  color: '#2ECC71' },
  sold:     { bg: 'rgba(136,136,136,0.15)', color: '#888'    },
  reserved: { bg: 'rgba(245,166,35,0.15)',  color: '#F5A623' },
  inactive: { bg: 'rgba(255,68,68,0.15)',   color: '#FF4444' },
}

export default function MarketplaceListings({ myItems }: Props) {
  const [items, setItems] = useState<MarketplaceListingRow[]>(myItems)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleStatus(id: string, status: MarketplaceStatus) {
    const supabase = createClient()
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ status })
      .eq('id', id)
    if (error) { showToast('Error: ' + error.message); return }
    setItems(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    showToast(status === 'sold' ? 'Marked as sold' : 'Marked as reserved')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id)
    if (error) { showToast('Error: ' + error.message); return }
    setItems(prev => prev.filter(l => l.id !== id))
    showToast('Listing deleted')
  }

  const cat = (id: string) => CATEGORIES.find(c => c.id === id)

  return (
    <div className="glass-card rounded-2xl p-6">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="font-heading" style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
          🛍️ My Marketplace
        </h2>
        <Link
          href="/marketplace/post"
          style={{ padding: '8px 16px', background: '#4ECDC4', color: '#1A1A0E', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}
        >
          + Sell Something
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🛍️</p>
          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 20px' }}>No marketplace listings yet</p>
          <Link
            href="/marketplace/post"
            style={{ display: 'inline-block', background: '#4ECDC4', color: '#1A1A0E', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
          >
            + Sell Something →
          </Link>
        </div>
      ) : (
        <div>
          {items.map(item => {
            const c = cat(item.category)
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.inactive
            return (
              <div
                key={item.id}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0, alignItems: 'center' }}>

                    {/* Thumbnail */}
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden',
                      background: 'linear-gradient(135deg, #4ECDC4, #2ECC71)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photos[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '22px' }}>{c?.emoji ?? '📦'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                          {item.status}
                        </span>
                        <span style={{ color: '#555', fontSize: '11px' }}>👁️ {item.views}</span>
                      </div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </p>
                      <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                        {c?.emoji} {c?.label} •{' '}
                        <span style={{ color: item.is_free ? '#2ECC71' : '#F5A623', fontWeight: 600 }}>
                          {item.is_free ? 'Free' : `€${item.price}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                    {item.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatus(item.id, 'sold')}
                          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(136,136,136,0.3)', borderRadius: '20px', color: '#888', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Mark Sold
                        </button>
                        <button
                          onClick={() => handleStatus(item.id, 'reserved')}
                          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '20px', color: '#F5A623', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Reserved
                        </button>
                      </>
                    )}
                    {item.status !== 'active' && (
                      <button
                        onClick={() => handleStatus(item.id, 'active')}
                        style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '20px', color: '#2ECC71', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Re-activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '20px', color: '#FF4444', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', padding: '10px', borderRadius: '10px', background: toast.startsWith('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(46,204,113,0.1)', color: toast.startsWith('Error') ? '#FF4444' : '#2ECC71', border: `1px solid ${toast.startsWith('Error') ? 'rgba(255,68,68,0.2)' : 'rgba(46,204,113,0.2)'}` }}>
          {toast}
        </div>
      )}
    </div>
  )
}
