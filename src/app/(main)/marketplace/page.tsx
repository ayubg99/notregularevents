export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import type { MarketplaceListingRow } from '@/types/database'

export const metadata: Metadata = {
  title: 'Erasmus Marketplace Valencia | Erasmus Life',
  description: 'Buy and sell with Erasmus students in Valencia. Free to list — clothes, electronics, furniture and more.',
}

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasMembership = false
  if (user) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('status, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    hasMembership =
      !!membership &&
      (membership.end_date === null || new Date(membership.end_date) > new Date())
  }

  const { data: listingsRaw } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const listings = (listingsRaw ?? []) as MarketplaceListingRow[]

  return (
    <main className="min-h-screen pt-32 pb-28 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.1 }}>
              Erasmus Marketplace
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
              Buy and sell with fellow Erasmus students. Leaving Valencia? Sell your stuff. Just arrived? Find everything you need.
            </p>
          </div>
          <Link
            href="/marketplace/post"
            style={{
              display:        'inline-block',
              background:     'linear-gradient(135deg, #E91E8C, #FF6B00)',
              color:          '#1A1A0E',
              padding:        '11px 22px',
              borderRadius:   '50px',
              textDecoration: 'none',
              fontWeight:     700,
              fontSize:       '14px',
              whiteSpace:     'nowrap',
              boxShadow:      '0 4px 16px rgba(233,30,140,0.25)',
            }}
          >
            + Sell Something
          </Link>
        </div>

        {/* Members banner for non-members */}
        {!hasMembership && (
          <div style={{
            background:     'rgba(255,107,0,0.08)',
            border:         '1px solid rgba(255,107,0,0.2)',
            borderRadius:   '12px',
            padding:        '14px 18px',
            marginBottom:   '24px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '12px',
            flexWrap:       'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>👑</span>
              <p style={{ color: '#FF6B00', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Members see seller contact details
              </p>
            </div>
            <Link
              href="/membership"
              style={{ color: '#FF6B00', fontSize: '13px', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Join Membership →
            </Link>
          </div>
        )}

        <MarketplaceClient initialListings={listings} />
      </div>
    </main>
  )
}
