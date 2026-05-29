'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function UpgradePage() {
  const searchParams = useSearchParams()
  const type  = searchParams.get('type')  ?? ''   // 'featured' | 'subscription'
  const jobId = searchParams.get('job')   ?? ''

  const [loadingType, setLoadingType] = useState<'featured' | 'subscription' | null>(null)
  const [error,       setError]       = useState('')
  const [isUrgent,    setIsUrgent]    = useState(false)

  async function handleUpgrade(upgradeType: 'featured' | 'subscription') {
    setError('')
    setLoadingType(upgradeType)
    try {
      const meRes = await fetch('/api/employer/me')
      if (!meRes.ok) { setError('Please log in to your employer account.'); return }
      const me = await meRes.json() as { id: string }

      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:        'job_upgrade',
          itemId:      me.id,
          upgradeType,
          employerId:  me.id,
          jobId:       upgradeType === 'featured' && jobId ? jobId : undefined,
          isFeatured:  upgradeType === 'featured' ? true : undefined,
          isUrgent:    upgradeType === 'featured' ? isUrgent : undefined,
        }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) { setError(data.error ?? 'Checkout failed. Please try again.'); return }
      window.location.href = data.url
    } finally {
      setLoadingType(null)
    }
  }

  const featuredHighlighted    = type === 'featured'    || (!type && !!jobId)
  const subscriptionHighlighted = type === 'subscription'

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-white mb-2">Upgrade Your Plan</h1>
        <p className="text-white/50 text-sm">Get more visibility for your job listings</p>
      </div>

      {error && (
        <p style={{ color: '#FF4444', fontSize: '13px', textAlign: 'center', marginBottom: '20px', background: 'rgba(255,68,68,0.1)', borderRadius: '10px', padding: '12px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Card 1 — Feature a Listing */}
        <div
          style={{
            background:   'rgba(255,255,255,0.03)',
            border:       featuredHighlighted ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding:      '28px',
          }}
        >
          <p style={{ color: '#F5A623', fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>⭐ Feature a Listing</p>
          <p style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: '0 0 4px' }}>
            €29{' '}
            <span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>one time</span>
          </p>
          <ul style={{ color: '#888', fontSize: '14px', margin: '16px 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Featured for 60 days</li>
            <li>Appears first in search results</li>
            <li>Highlighted card design</li>
            <li>For one specific listing</li>
          </ul>
          {jobId && (
            <p style={{ color: '#F5A623', fontSize: '13px', margin: '12px 0 0', fontWeight: 600 }}>
              ✓ Will feature the selected listing
            </p>
          )}

          {/* Urgent add-on */}
          <div
            onClick={() => setIsUrgent(u => !u)}
            style={{
              marginTop:    '16px',
              background:   isUrgent ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.02)',
              border:       isUrgent ? '2px solid rgba(255,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding:      '14px 16px',
              cursor:       'pointer',
              display:      'flex',
              justifyContent: 'space-between',
              alignItems:   'center',
            }}
          >
            <div>
              <p style={{ color: isUrgent ? '#FF4444' : '#ccc', fontWeight: 600, margin: '0 0 4px', fontSize: '14px' }}>
                🔥 Add Urgent Badge
              </p>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                Red urgent badge • &quot;Hiring now&quot; label • More applications
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isUrgent ? '#FF4444' : '#888', fontWeight: 700, fontSize: '15px' }}>+€9</span>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                border:      isUrgent ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background:  isUrgent ? '#FF4444' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '14px', fontWeight: 700,
              }}>
                {isUrgent ? '✓' : ''}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('featured')}
            disabled={loadingType !== null}
            style={{
              width:        '100%',
              marginTop:    '20px',
              padding:      '14px',
              background:   loadingType ? 'rgba(245,166,35,0.5)' : '#F5A623',
              color:        '#1A1A2E',
              border:       'none',
              borderRadius: '50px',
              fontWeight:   700,
              fontSize:     '15px',
              cursor:       loadingType ? 'not-allowed' : 'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          '8px',
            }}
          >
            {loadingType === 'featured'
              ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
              : isUrgent ? 'Feature + Urgent — €38' : 'Feature This Listing — €29'}
          </button>
        </div>

        {/* Card 2 — Employer Plan */}
        <div
          style={{
            background:   'rgba(255,255,255,0.03)',
            border:       subscriptionHighlighted ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding:      '28px',
            position:     'relative',
          }}
        >
          {/* Best value badge */}
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#F5A623', color: '#1A1A2E', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Best Value
          </div>

          <p style={{ color: '#F5A623', fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>🏢 Employer Plan</p>
          <p style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: '0 0 4px' }}>
            €49{' '}
            <span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/month</span>
          </p>
          <ul style={{ color: '#888', fontSize: '14px', margin: '16px 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Unlimited job postings</li>
            <li>ALL listings featured automatically</li>
            <li>New jobs auto-featured on posting</li>
            <li>Priority support</li>
            <li>Cancel anytime</li>
          </ul>
          <button
            onClick={() => handleUpgrade('subscription')}
            disabled={loadingType !== null}
            style={{
              width:        '100%',
              marginTop:    '20px',
              padding:      '14px',
              background:   loadingType ? 'rgba(245,166,35,0.5)' : '#F5A623',
              color:        '#1A1A2E',
              border:       'none',
              borderRadius: '50px',
              fontWeight:   700,
              fontSize:     '15px',
              cursor:       loadingType ? 'not-allowed' : 'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          '8px',
            }}
          >
            {loadingType === 'subscription' ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Start Employer Plan — €49/mo'}
          </button>
        </div>
      </div>

      <p className="text-center mt-8">
        <Link href="/employer/dashboard" className="text-white/40 text-sm hover:text-white/70 transition-colors">
          ← Back to dashboard
        </Link>
      </p>
    </main>
  )
}

export default function EmployerUpgradePage() {
  return (
    <Suspense>
      <UpgradePage />
    </Suspense>
  )
}
