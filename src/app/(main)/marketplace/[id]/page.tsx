export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContactSection } from '@/components/marketplace/ContactSection'
import PhotoGallery from '@/components/marketplace/PhotoGallery'
import { CATEGORIES, CONDITIONS } from '@/lib/marketplace'
import type { MarketplaceListingRow } from '@/types/database'

export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listingRaw } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!listingRaw) notFound()

  const listing = listingRaw as MarketplaceListingRow

  // Increment views (fire-and-forget)
  supabase
    .from('marketplace_listings')
    .update({ views: listing.views + 1 })
    .eq('id', id)
    .then(() => {})

  const cat       = CATEGORIES.find(c => c.id === listing.category)
  const condition = CONDITIONS.find(c => c.id === listing.condition)

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back link */}
        <Link
          href="/marketplace"
          style={{ color: '#888', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}
        >
          ← Back to Marketplace
        </Link>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="md:marketplace-grid">
          <style>{`@media (min-width: 768px) { .md\\:marketplace-grid { grid-template-columns: 65% 1fr !important; } }`}</style>

          {/* RIGHT on mobile (sticky contact, shown first on mobile) */}
          <div style={{ order: -1 }} className="md-right-col">
            <style>{`@media (min-width: 768px) { .md-right-col { order: 1 !important; } }`}</style>

            {/* Pricing card */}
            <div style={{
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding:      '20px',
              marginBottom: '12px',
            }}>
              <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', margin: '0 0 8px' }}>
                {cat?.label}
              </p>
              <p style={{
                color:      listing.is_free ? '#2ECC71' : '#F5A623',
                fontSize:   '32px',
                fontWeight: 700,
                margin:     '0 0 4px',
                lineHeight: 1,
              }}>
                {listing.is_free ? 'Free' : `€${listing.price}`}
              </p>
              {listing.is_negotiable && (
                <p style={{ color: '#888', fontSize: '12px', margin: '0 0 12px' }}>Price negotiable</p>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '13px' }}>Condition</span>
                  <span style={{ color: condition?.color, fontSize: '13px', fontWeight: 600 }}>{condition?.label}</span>
                </div>
                {(listing.size_clothes || listing.size_shoes) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '13px' }}>Size</span>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{listing.size_clothes ?? listing.size_shoes}</span>
                  </div>
                )}
                {listing.brand && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '13px' }}>Brand</span>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{listing.brand}</span>
                  </div>
                )}
                {listing.neighborhood && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '13px' }}>Location</span>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>📍 {listing.neighborhood}</span>
                  </div>
                )}
              </div>
            </div>

            <ContactSection listing={listing} />
          </div>

          {/* LEFT column — main content */}
          <div>
            {/* Photo gallery */}
            <PhotoGallery
              photos={listing.photos ?? []}
              title={listing.title}
              catEmoji={cat?.emoji ?? '📦'}
            />

            {/* Title & price */}
            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
              {listing.title}
            </h1>
            <p style={{ color: listing.is_free ? '#2ECC71' : '#F5A623', fontSize: '28px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1 }}>
              {listing.is_free ? 'Free' : `€${listing.price}`}
            </p>
            {listing.is_negotiable && (
              <p style={{ color: '#888', fontSize: '12px', margin: '0 0 16px' }}>Negotiable</p>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {cat?.label}
              </span>
              <span style={{ background: 'rgba(0,0,0,0.4)', color: condition?.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {condition?.label}
              </span>
              {(listing.size_clothes || listing.size_shoes) && (
                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  Size {listing.size_clothes ?? listing.size_shoes}
                </span>
              )}
              {listing.brand && (
                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontStyle: 'italic' }}>
                  {listing.brand}
                </span>
              )}
              {listing.color && (
                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {listing.color}
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {listing.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listing.neighborhood && (
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{listing.neighborhood}, Valencia</p>
              )}
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                Posted {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                Expires {new Date(listing.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Ticket info card */}
            {listing.category === 'tickets_events' && (
              <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ color: '#F5A623', fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Event Ticket Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {listing.event_date && (
                    <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>
                      {new Date(listing.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {listing.event_venue && (
                    <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>{listing.event_venue}</p>
                  )}
                  {listing.ticket_quantity && (
                    <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>{listing.ticket_quantity} ticket{listing.ticket_quantity > 1 ? 's' : ''} available</p>
                  )}
                </div>
                <p style={{ color: '#888', fontSize: '12px', margin: '12px 0 0', lineHeight: 1.5 }}>
                  Verify ticket authenticity before completing any payment.
                </p>
              </div>
            )}

            {/* Seller card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width:           '44px',
                height:          '44px',
                borderRadius:    '50%',
                background:      'linear-gradient(135deg, #4ECDC4, #2ECC71)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontWeight:      700,
                fontSize:        '18px',
                color:           '#fff',
                flexShrink:      0,
              }}>
                {listing.seller_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>
                  {listing.seller_name.split(' ')[0]}
                </p>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  {[listing.seller_nationality, listing.university].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
