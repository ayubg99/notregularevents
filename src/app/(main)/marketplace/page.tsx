export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from '@/components/marketplace/MarketplaceClient'
import type { MarketplaceListingRow } from '@/types/database'

export const metadata: Metadata = {
  title: 'Student Marketplace | Erasmus Vibe',
  description: 'Buy and sell with Erasmus students in Valencia. Free to list — clothes, electronics, tickets and more.',
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
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Hero banner */}
        <div style={{
          background:   '#16161E',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding:      '48px 32px',
          marginBottom: '32px',
          position:     'relative',
          overflow:     'hidden',
        }}>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: '#FF6B35', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Erasmus Vibe
            </p>
            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.1 }}>
              Student Marketplace
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', margin: '0 0 28px', maxWidth: '500px' }}>
              Buy and sell with Erasmus students. Free to list. Members see contacts.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/marketplace/post"
                style={{
                  display:        'inline-block',
                  background:     'linear-gradient(135deg, #FF6B35, #F5A623)',
                  color:          '#1A1A0E',
                  padding:        '12px 24px',
                  borderRadius:   '50px',
                  textDecoration: 'none',
                  fontWeight:     700,
                  fontSize:       '14px',
                  boxShadow:      '0 4px 20px rgba(255,107,53,0.3)',
                }}
              >
                + Sell Something
              </Link>
              <div style={{ display: 'flex', gap: '24px' }}>
                {[
                  { value: 'Free', label: 'To list' },
                  { value: '15+',  label: 'Categories' },
                  { value: '0%',   label: 'Commission' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p style={{ color: '#F5A623', fontSize: '20px', fontWeight: 800, margin: '0 0 2px', lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Members banner for non-members */}
        {!hasMembership && (
          <div style={{
            background:     'rgba(245,166,35,0.08)',
            border:         '1px solid rgba(245,166,35,0.2)',
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
              <p style={{ color: '#F5A623', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Members see seller contact details
              </p>
            </div>
            <Link
              href="/membership"
              style={{ color: '#F5A623', fontSize: '13px', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
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
