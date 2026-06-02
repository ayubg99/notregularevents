import { stripe } from '@/lib/stripe'

export const metadata = { title: 'Stripe Connect — Admin' }

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function transferLabel(type: string) {
  if (type === 'membership_split') return 'Membership'
  return 'Events / Trips'
}

export default async function StripeStatusPage() {
  const accountId = process.env.ERASMUS_VIBE_STRIPE_ACCOUNT_ID

  let accountStatus: {
    id:             string
    chargesEnabled: boolean
    payoutsEnabled: boolean
  } | null = null

  let recentTransfers: { id: string; amount: number; created: number; type: string }[] = []

  if (accountId) {
    try {
      const account = await stripe.accounts.retrieve(accountId)
      accountStatus = {
        id:             account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      }
    } catch (err) {
      console.error('Could not fetch Stripe account:', err)
    }

    if (accountStatus) {
      try {
        const transfers = await stripe.transfers.list({ destination: accountId, limit: 5 })
        recentTransfers = transfers.data.map(t => ({
          id:      t.id,
          amount:  t.amount,
          created: t.created,
          type:    (t.metadata?.type as string) || 'transfer',
        }))
      } catch (err) {
        console.error('Could not fetch transfers:', err)
      }
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>
        Stripe Connect Status
      </h1>

      {!accountId ? (
        <div style={{
          background:   'rgba(255,68,68,0.1)',
          border:       '1px solid rgba(255,68,68,0.3)',
          borderRadius: '12px',
          padding:      '20px',
        }}>
          <p style={{ color: '#FF4444', margin: 0 }}>
            ❌ ERASMUS_VIBE_STRIPE_ACCOUNT_ID not set in environment variables.
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0' }}>
            Visit /api/stripe/connect/onboard?secret=ADMIN_SECRET to set up the connected account.
          </p>
        </div>
      ) : accountStatus ? (
        <div style={{
          background:   'rgba(255,255,255,0.03)',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding:      '24px',
        }}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width:        '12px',
              height:       '12px',
              borderRadius: '50%',
              background:   accountStatus.chargesEnabled ? '#2ECC71' : '#FF4444',
            }} />
            <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '16px' }}>
              Erasmus Vibe — {accountStatus.chargesEnabled ? 'Active ✅' : 'Pending Setup ⏳'}
            </p>
          </div>

          {/* Connection details */}
          {[
            { label: 'Account ID',      value: accountStatus.id                             },
            { label: 'Charges enabled', value: accountStatus.chargesEnabled ? '✅ Yes' : '❌ No' },
            { label: 'Payouts enabled', value: accountStatus.payoutsEnabled ? '✅ Yes' : '❌ No' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                padding:        '10px 0',
                borderBottom:   '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span style={{ color: '#888', fontSize: '14px' }}>{item.label}</span>
              <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>{item.value}</span>
            </div>
          ))}

          {/* Recent transfers */}
          <div style={{ marginTop: '24px' }}>
            <p style={{ color: '#F5A623', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>
              Recent Transfers
            </p>
            {recentTransfers.length === 0 ? (
              <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>No transfers yet.</p>
            ) : (
              recentTransfers.map(t => (
                <div
                  key={t.id}
                  style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    padding:        '8px 0',
                    borderBottom:   '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ color: '#ccc', fontSize: '14px', fontWeight: 600 }}>
                    {formatEur(t.amount)}
                  </span>
                  <span style={{ color: '#888', fontSize: '13px' }}>
                    {transferLabel(t.type)}
                  </span>
                  <span style={{ color: '#555', fontSize: '12px', fontFamily: 'monospace' }}>
                    {formatDate(t.created)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: '#FF4444' }}>Could not fetch account details — check server logs.</p>
      )}
    </div>
  )
}
