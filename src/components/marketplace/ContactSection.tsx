'use client'

import { useState, useEffect } from'react'
import { createClient } from'@/lib/supabase/client'
import type { MarketplaceListingRow } from'@/types/database'

interface Props {
  listing: MarketplaceListingRow
}

export function ContactSection({ listing }: Props) {
  const [hasMembership, setHasMembership] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('memberships')
        .select('status, end_date')
        .eq('user_id', user.id)
        .eq('status','active')
        .maybeSingle()

      setHasMembership(
        !!data && (data.end_date === null || new Date(data.end_date) > new Date())
      )
      setLoading(false)
    }
    check()
  }, [])

  if (loading) {
    return (
      <div style={{
        background:'rgba(255,255,255,0.02)',
        borderRadius:'16px',
        padding:'20px',
        height:'120px',
      }} />
    )
  }

  if (hasMembership) {
    const waMsg = encodeURIComponent(
`Hi! I saw your listing"${listing.title}" on Erasmus Life. Is it still available?`
    )
    const waNumber = listing.contact_whatsapp?.replace(/[^0-9]/g,'') ??''

    return (
      <div style={{
        background:'rgba(255,255,255,0.03)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:'16px',
        padding:'20px',
      }}>
        <h3 style={{ color:'#fff', fontSize:'15px', fontWeight: 600, margin:'0 0 14px' }}>
          Contact Seller
        </h3>

        {listing.contact_whatsapp && (
          <a
            href={`https://wa.me/${waNumber}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'8px',
              background:'#25D366',
              color:'#fff',
              padding:'14px',
              borderRadius:'50px',
              textDecoration:'none',
              fontWeight: 700,
              fontSize:'14px',
              marginBottom:'10px',
            }}
          >
             WhatsApp {listing.seller_name.split('')[0]}
          </a>
        )}

        {listing.contact_email && (
          <a
            href={`mailto:${listing.contact_email}?subject=Re: ${listing.title} on Erasmus Life`}
            style={{
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'8px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#ccc',
              padding:'12px',
              borderRadius:'50px',
              textDecoration:'none',
              fontSize:'14px',
              marginBottom:'12px',
            }}
          >
             {listing.contact_email}
          </a>
        )}

        <p style={{ color:'#555', fontSize:'12px', textAlign:'center', margin: 0, lineHeight: 1.5 }}>
          Always meet in a public place. Never send money in advance.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background:'rgba(255,107,0,0.08)',
      border:'1px solid rgba(255,107,0,0.2)',
      borderRadius:'16px',
      padding:'24px',
      textAlign:'center',
    }}>
      <p style={{ fontSize:'32px', margin:'0 0 8px' }}></p>
      <h3 style={{ color:'#FF6B00', margin:'0 0 8px', fontSize:'16px' }}>Members only</h3>
      <p style={{ color:'#888', fontSize:'13px', margin:'0 0 16px', lineHeight: 1.5 }}>
        Join membership to contact sellers and access all marketplace listings
      </p>
      <a
        href="/membership"
        style={{
          display:'block',
          background:'linear-gradient(135deg, #FF6B00, #E91E8C)',
          color:'#1A1A0E',
          padding:'13px',
          borderRadius:'50px',
          textDecoration:'none',
          fontWeight: 700,
          fontSize:'14px',
          boxShadow:'0 4px 16px rgba(255,107,0,0.25)',
        }}
      >
        Join Membership →
      </a>
    </div>
  )
}
