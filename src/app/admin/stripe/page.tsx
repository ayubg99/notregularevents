'use client'
import { useState, useEffect } from 'react'

interface StripeStatus {
  connected: boolean
  accountId?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
  status?: 'active' | 'pending'
  error?: string
}

export default function StripeConnectPage() {
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const res = await fetch('/api/admin/stripe-connect/status')
      const data = await res.json()
      setStatus(data)
      setLoading(false)
    })()
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/admin/stripe-connect', { method: 'POST' })
      const data = await res.json()
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      } else {
        setConnectError(data.error ?? 'No onboarding URL returned — check server logs.')
        setConnecting(false)
      }
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Network error')
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <p style={{ color: '#888' }}>Loading Stripe status...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>
        Stripe Connect Status
      </h1>

      {!status?.connected ? (
        <div style={{
          background: 'rgba(45,91,255,0.08)',
          border: '1px solid rgba(45,91,255,0.25)',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>💳</p>
          <h2 style={{ color: '#6B7FFF', margin: '0 0 8px', fontSize: '18px' }}>
            Stripe not connected yet
          </h2>
          <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px' }}>
            Connect a Stripe account to start receiving payouts from events.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: '14px 32px',
              background: '#6B7FFF',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: connecting ? 'wait' : 'pointer',
            }}
          >
            {connecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account →'}
          </button>
          {connectError && (
            <p style={{ color: '#FF6B6B', marginTop: '12px', fontSize: '13px' }}>
              Error: {connectError}
            </p>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: status.status === 'active' ? '#2ECC71' : '#FFB300',
            }} />
            <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '16px' }}>
              Not Regular Events —{' '}
              {status.status === 'active' ? 'Active ✅' : 'Pending Setup ⏳'}
            </p>
          </div>

          {[
            { label: 'Account ID',        value: status.accountId ?? '—' },
            { label: 'Charges enabled',   value: status.chargesEnabled   ? '✅ Yes' : '❌ No' },
            { label: 'Payouts enabled',   value: status.payoutsEnabled   ? '✅ Yes' : '❌ No' },
            { label: 'Details submitted', value: status.detailsSubmitted ? '✅ Yes' : '❌ No' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span style={{ color: '#888', fontSize: '14px' }}>{item.label}</span>
              <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>
                {item.value}
              </span>
            </div>
          ))}

          {status.status !== 'active' && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'rgba(45,91,255,0.1)',
                border: '1px solid #6B7FFF',
                color: '#6B7FFF',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {connecting ? 'Redirecting...' : 'Finish Setup →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
