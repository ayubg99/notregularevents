'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EmployerAccountRow, JobListingRow } from '@/types/database'

interface Props {
  employer:  EmployerAccountRow
  jobs:      JobListingRow[]
  upgraded?: boolean
}

function formatExpiry(iso: string) {
  const d       = new Date(iso)
  const expired = d < new Date()
  return {
    label:   expired
      ? '⚠️ Expired'
      : `Expires ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    expired,
  }
}

export default function EmployerDashboardClient({ employer, jobs: initial, upgraded }: Props) {
  const router = useRouter()
  const [jobs,       setJobs]       = useState<JobListingRow[]>(initial)
  const [toast,      setToast]      = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function patchJob(id: string, fields: Record<string, unknown>) {
    const res  = await fetch(`/api/jobs/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(fields),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (!res.ok) { setToast('Error: ' + (data.error ?? 'Failed')); return false }
    return true
  }

  async function handleClose(id: string) {
    if (!await patchJob(id, { status: 'closed' })) return
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed' } : j))
    setToast('Listing closed')
  }

  async function handleReopen(id: string) {
    const job = jobs.find(j => j.id === id)
    if (job && new Date(job.expires_at) < new Date()) { setToast('Listing expired — post a new one'); return }
    if (!await patchJob(id, { status: 'active' })) return
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'active' } : j))
    setToast('Listing reopened')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job listing permanently?')) return
    const res  = await fetch(`/api/jobs/${id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (!res.ok) { setToast('Error: ' + (data.error ?? 'Failed')); return }
    setJobs(prev => prev.filter(j => j.id !== id))
    setToast('Listing deleted')
  }

  async function handleCancelSubscription() {
    if (!confirm('Cancel your Employer Plan subscription? Your listings will remain active until the current period ends.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/employer/cancel-subscription', { method: 'POST' })
      if (!res.ok) { setToast('Failed to cancel subscription.'); return }
      setToast('Subscription cancelled. Plan will revert to free.')
      router.refresh()
    } finally {
      setCancelling(false)
    }
  }

  const activeCount = jobs.filter(j => j.status === 'active').length
  const totalViews  = jobs.reduce((s, j) => s + (j.views ?? 0), 0)

  const [showUpgraded, setShowUpgraded] = useState(upgraded ?? false)

  return (
    <div>
      {/* ── Upgrade success banner ───────────────────────────────── */}
      {showUpgraded && (
        <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <p style={{ color: '#2ECC71', fontWeight: 600, margin: 0, fontSize: '14px' }}>
              Plan upgraded successfully! All your active listings are now featured.
            </p>
          </div>
          <button onClick={() => setShowUpgraded(false)} style={{ background: 'transparent', border: 'none', color: '#2ECC71', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px', opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,107,53,0.04))', border: '1px solid rgba(245,166,35,0.15)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Company initial avatar */}
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #F5A623, #FF6B35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '24px', color: '#1A1A0E', flexShrink: 0, boxShadow: '0 8px 24px rgba(245,166,35,0.25)' }}>
            {employer.company_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px', fontWeight: 500 }}>Welcome back</p>
            <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.2 }}>{employer.company_name}</h1>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{employer.contact_name} • {employer.email}</p>
          </div>
        </div>
        <Link
          href="/jobs/post"
          style={{ padding: '13px 24px', background: 'linear-gradient(135deg, #F5A623, #FF6B35)', color: '#1A1A0E', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(245,166,35,0.3)', transition: 'transform 0.2s' }}
        >
          + Post a Job
        </Link>
      </div>

      {/* ── Plan status card ────────────────────────────────────── */}

      {employer.plan === 'free' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Current Plan</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 4px' }}>Free Plan</p>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Standard listings • 30 days active</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="/employer/upgrade?type=featured" style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623', borderRadius: '50px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
              ⭐ Feature listing — €29
            </a>
            <a href="/employer/upgrade?type=subscription" style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #F5A623, #FF6B35)', color: '#1A1A0E', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(245,166,35,0.2)' }}>
              🏢 Employer Plan — €49/mo
            </a>
          </div>
        </div>
      )}

      {employer.plan === 'featured' && (
        <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#F5A623', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>⭐ Featured Plan</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 4px' }}>One listing featured for 60 days</p>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Want all listings featured automatically?</p>
          </div>
          <a href="/employer/upgrade?type=subscription" style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #F5A623, #FF6B35)', color: '#1A1A0E', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(245,166,35,0.2)' }}>
            Upgrade to €49/mo →
          </a>
        </div>
      )}

      {employer.plan === 'subscription' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,107,53,0.04))', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#F5A623', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>🏢 Employer Plan — Active</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 4px' }}>€49/month — Unlimited featured listings</p>
            {employer.plan_expires_at && (
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                Renews {new Date(employer.plan_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', borderRadius: '50px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Plan'}
          </button>
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Active listings', value: activeCount,  color: '#2ECC71' },
          { label: 'Total views',     value: totalViews,   color: '#F5A623' },
          { label: 'Total posted',    value: jobs.length,  color: '#4ECDC4' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ color: stat.color, fontSize: '32px', fontWeight: 700, margin: '0 0 6px', lineHeight: 1 }}>{stat.value}</p>
            <p style={{ color: '#888', fontSize: '12px', margin: 0, fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Job listings ─────────────────────────────────────────── */}
      <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '8px 0 20px' }}>My Job Listings</h2>

      {jobs.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            💼
          </div>
          <p style={{ color: '#888', margin: '0 0 20px', fontSize: '15px' }}>No job listings yet</p>
          <Link href="/jobs/post" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #F5A623, #FF6B35)', color: '#1A1A0E', padding: '12px 28px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, boxShadow: '0 4px 16px rgba(245,166,35,0.25)' }}>
            Post Your First Job
          </Link>
        </div>
      ) : (
        jobs.map(job => {
          const { label: expiryLabel, expired } = formatExpiry(job.expires_at)
          return (
            <div
              key={job.id}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '10px', transition: 'border 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(245,166,35,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {job.job_type.replace(/_/g, ' ')}
                    </span>
                    <span style={{ background: job.status === 'active' ? 'rgba(46,204,113,0.15)' : job.status === 'draft' ? 'rgba(245,166,35,0.15)' : 'rgba(255,68,68,0.15)', color: job.status === 'active' ? '#2ECC71' : job.status === 'draft' ? '#F5A623' : '#FF4444', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                      ● {job.status}
                    </span>
                    {job.is_featured && (
                      <span style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        ⭐ Featured
                      </span>
                    )}
                    {job.is_urgent && (
                      <span style={{ background: 'rgba(255,68,68,0.15)', color: '#FF4444', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        🔥 Urgent
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.title}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#555', fontSize: '12px' }}>{job.views ?? 0} views</span>
                    <span style={{ color: '#555', fontSize: '12px' }}>{new Date(job.created_at).toLocaleDateString('en-GB')}</span>
                    <span style={{ color: expired ? '#FF4444' : '#555', fontSize: '12px' }}>{expiryLabel}</span>
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <a
                    href={`/jobs/edit/${job.id}`}
                    style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#ccc', fontSize: '12px', textDecoration: 'none', textAlign: 'center', fontWeight: 500, whiteSpace: 'nowrap' }}
                  >
                    Edit
                  </a>

                  {!job.is_featured && employer.plan !== 'subscription' && (
                    <a
                      href={`/employer/upgrade?type=featured&job=${job.id}`}
                      style={{ padding: '7px 14px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '20px', color: '#F5A623', fontSize: '12px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}
                    >
                      ⭐ Feature
                    </a>
                  )}

                  {employer.plan === 'subscription' && !job.is_featured && (
                    <span style={{ padding: '7px 14px', background: 'rgba(245,166,35,0.05)', borderRadius: '20px', color: '#888', fontSize: '11px', textAlign: 'center', display: 'block' }}>
                      Auto-featured ✓
                    </span>
                  )}

                  {job.status === 'active' ? (
                    <button
                      onClick={() => handleClose(job.id)}
                      style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '20px', color: '#FFA500', fontSize: '12px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopen(job.id)}
                      style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '20px', color: '#2ECC71', fontSize: '12px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      Reopen
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(job.id)}
                    style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,68,68,0.25)', borderRadius: '20px', color: '#FF4444', fontSize: '12px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Toast */}
      {toast && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', padding: '12px', borderRadius: '10px', background: toast.startsWith('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(46,204,113,0.1)', color: toast.startsWith('Error') ? '#FF4444' : '#2ECC71', border: `1px solid ${toast.startsWith('Error') ? 'rgba(255,68,68,0.2)' : 'rgba(46,204,113,0.2)'}` }}>
          {toast}
        </div>
      )}
    </div>
  )
}
