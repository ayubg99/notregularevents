'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, CONDITIONS } from '@/lib/marketplace'
import { deactivateMarketplaceListing, deleteMarketplaceListing } from '@/app/actions/admin'
import type { MarketplaceListingRow } from '@/types/database'

interface Props {
  listings: MarketplaceListingRow[]
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:   { bg: 'rgba(46,204,113,0.15)',  color: '#2ECC71' },
  sold:     { bg: 'rgba(136,136,136,0.15)', color: '#888'    },
  reserved: { bg: 'rgba(245,166,35,0.15)',  color: '#F5A623' },
  inactive: { bg: 'rgba(255,68,68,0.15)',   color: '#FF4444' },
}

export default function MarketplaceClient({ listings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleDeactivate(id: string) {
    startTransition(async () => {
      await deactivateMarketplaceListing(id)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMarketplaceListing(id)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', opacity: isPending ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Item', 'Category', 'Price', 'Seller', 'Condition', 'Status', 'Views', 'Posted', 'Expires', 'Actions'].map(h => (
                <th key={h} style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 && (
              <tr>
                <td colSpan={10} style={{ color: '#555', textAlign: 'center', padding: '40px', fontSize: '14px' }}>
                  No listings yet
                </td>
              </tr>
            )}
            {listings.map(listing => {
              const cat  = CATEGORIES.find(c => c.id === listing.category)
              const cond = CONDITIONS.find(c => c.id === listing.condition)
              const sc   = STATUS_COLORS[listing.status] ?? STATUS_COLORS.inactive
              return (
                <tr key={listing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Item */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', background: 'linear-gradient(135deg, #4ECDC4, #2ECC71)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {listing.photos?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={listing.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '16px' }}>{cat?.emoji}</span>
                        }
                      </div>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {listing.title}
                      </span>
                    </div>
                  </td>
                  {/* Category */}
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {cat?.label}
                  </td>
                  {/* Price */}
                  <td style={{ padding: '12px 16px', color: listing.is_free ? '#2ECC71' : '#F5A623', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {listing.is_free ? 'Free' : `€${listing.price}`}
                  </td>
                  {/* Seller */}
                  <td style={{ padding: '12px 16px', color: '#ccc', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {listing.seller_name}
                  </td>
                  {/* Condition */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: cond?.color, fontSize: '12px', fontWeight: 600 }}>{cond?.label}</span>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                      {listing.status}
                    </span>
                  </td>
                  {/* Views */}
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: '12px' }}>
                    {listing.views}
                  </td>
                  {/* Posted */}
                  <td style={{ padding: '12px 16px', color: '#888', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  {/* Expires */}
                  <td style={{ padding: '12px 16px', color: '#555', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(listing.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {listing.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(listing.id)}
                          style={{ padding: '5px 10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px', color: '#FF4444', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Deactivate
                        </button>
                      )}
                      {confirmDelete === listing.id ? (
                        <>
                          <button onClick={() => handleDelete(listing.id)} style={{ padding: '5px 10px', background: 'rgba(255,68,68,0.2)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#FF4444', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>
                            Confirm
                          </button>
                          <button onClick={() => setConfirmDelete(null)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(listing.id)} style={{ padding: '5px 10px', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '8px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
