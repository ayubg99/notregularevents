'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function UpgradePage() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job') ?? ''

  const [selected, setSelected]   = useState<'featured' | 'subscription'>(jobId ? 'featured' : 'subscription')
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')

  async function handleUpgrade() {
    setError('')
    setLoading(true)
    try {
      // Get employer id from API
      const meRes = await fetch('/api/employer/me')
      if (!meRes.ok) { setError('Please log in to your employer account.'); return }
      const me = await meRes.json() as { id: string }

      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:         'job_upgrade',
          itemId:       me.id,
          upgradeType:  selected,
          employerId:   me.id,
          jobId:        selected === 'featured' ? jobId : undefined,
        }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) { setError(data.error ?? 'Checkout failed.'); return }
      window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-white mb-2">Upgrade Your Plan</h1>
        <p className="text-white/50 text-sm">Get more visibility for your job listings</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {/* Featured listing option */}
        <button
          type="button"
          onClick={() => setSelected('featured')}
          style={{
            background:   selected === 'featured' ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.02)',
            border:       selected === 'featured' ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding:      '20px 24px',
            cursor:       'pointer',
            textAlign:    'left',
            display:      'flex',
            alignItems:   'flex-start',
            justifyContent: 'space-between',
            gap:          '16px',
            transition:   'all 0.15s',
          }}
        >
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>⭐ Feature a Listing</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Active for 60 days', 'Appears first in results', 'Highlighted card'].map(f => (
                <li key={f} style={{ color: '#888', fontSize: '13px' }}>✓ {f}</li>
              ))}
            </ul>
            {jobId && <p style={{ color: '#F5A623', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>✓ 1 specific listing pre-selected</p>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ color: '#F5A623', fontWeight: 800, fontSize: '22px' }}>€29</span>
            <span style={{ color: '#555', fontSize: '12px', display: 'block' }}>one-time</span>
          </div>
        </button>

        {/* Employer plan option */}
        <button
          type="button"
          onClick={() => setSelected('subscription')}
          style={{
            background:   selected === 'subscription' ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.02)',
            border:       selected === 'subscription' ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding:      '20px 24px',
            cursor:       'pointer',
            textAlign:    'left',
            display:      'flex',
            alignItems:   'flex-start',
            justifyContent: 'space-between',
            gap:          '16px',
            position:     'relative',
            transition:   'all 0.15s',
          }}
        >
          <span style={{ position: 'absolute', top: '-1px', right: '16px', background: '#F5A623', color: '#1A1A2E', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best value</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>🏢 Employer Plan</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Unlimited job postings', 'All listings featured automatically', 'Cancel anytime'].map(f => (
                <li key={f} style={{ color: '#888', fontSize: '13px' }}>✓ {f}</li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ color: '#F5A623', fontWeight: 800, fontSize: '22px' }}>€49</span>
            <span style={{ color: '#555', fontSize: '12px', display: 'block' }}>/month</span>
          </div>
        </button>
      </div>

      {error && <p style={{ color: '#FF4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-brand-primary hover:brightness-110 disabled:opacity-60 text-white font-bold text-base transition-all flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Continue to Payment →'}
      </button>

      <p className="text-center mt-4">
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
