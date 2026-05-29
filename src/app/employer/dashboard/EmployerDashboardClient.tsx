'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EmployerAccountRow, JobListingRow } from '@/types/database'

interface Props {
  employer: EmployerAccountRow
  jobs:     JobListingRow[]
}

function formatExpiry(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const expired = d < now
  return {
    label:   expired ? '⚠️ Expired' : `Expires ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    expired,
  }
}

export default function EmployerDashboardClient({ employer, jobs: initial }: Props) {
  const router  = useRouter()
  const [jobs,   setJobs]   = useState<JobListingRow[]>(initial)
  const [toast,  setToast]  = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function patchJob(id: string, fields: Record<string, unknown>) {
    const res = await fetch(`/api/jobs/${id}`, {
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
    const res = await fetch(`/api/jobs/${id}`, {
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

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 4px' }}>Welcome back</p>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{employer.company_name}</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{employer.contact_name} · {employer.email}</p>
        </div>
        <Link
          href="/jobs/post"
          style={{ padding: '12px 20px', background: '#F5A623', color: '#1A1A2E', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          + Post a Job
        </Link>
      </div>

      {/* Plan card */}
      {employer.plan === 'free' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 4px' }}>Current plan</p>
            <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>Free — Standard listings only</p>
          </div>
          <Link
            href="/employer/upgrade"
            style={{ padding: '10px 20px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            ⭐ Upgrade Plan
          </Link>
        </div>
      )}

      {employer.plan === 'featured' && (
        <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ color: '#F5A623', fontSize: '12px', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase' }}>Featured Plan</p>
          <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>One listing featured for 60 days</p>
        </div>
      )}

      {employer.plan === 'subscription' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,107,53,0.08))', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#F5A623', fontSize: '12px', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase' }}>Employer Plan Active</p>
            <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 4px' }}>€49/month — Unlimited featured listings</p>
            {employer.plan_expires_at && (
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                Renews {new Date(employer.plan_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', borderRadius: '50px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { value: activeCount,  label: 'Active listings' },
          { value: totalViews,   label: 'Total views'     },
          { value: jobs.length,  label: 'Total posted'    },
        ].map(({ value, label }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <p style={{ color: '#F5A623', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{value}</p>
            <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Job listings */}
      <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>My Job Listings</h2>

      {jobs.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>💼</p>
          <p style={{ color: '#888', margin: '0 0 20px' }}>No job listings yet</p>
          <Link href="/jobs/post" style={{ display: 'inline-block', background: '#F5A623', color: '#1A1A2E', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700 }}>
            Post Your First Job
          </Link>
        </div>
      ) : (
        jobs.map(job => {
          const { label: expiryLabel, expired } = formatExpiry(job.expires_at)
          return (
            <div key={job.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>{job.job_type.replace(/_/g, ' ')}</span>
                  <span style={{ background: job.status === 'active' ? 'rgba(46,204,113,0.15)' : job.status === 'draft' ? 'rgba(245,166,35,0.15)' : 'rgba(255,68,68,0.15)', color: job.status === 'active' ? '#2ECC71' : job.status === 'draft' ? '#F5A623' : '#FF4444', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>● {job.status}</span>
                  {job.is_featured && <span style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>⭐ Featured</span>}
                  {job.is_urgent   && <span style={{ background: 'rgba(255,68,68,0.15)', color: '#FF4444', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>🔥 Urgent</span>}
                </div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#555', fontSize: '12px' }}>👁️ {job.views ?? 0} views</span>
                  <span style={{ color: '#555', fontSize: '12px' }}>📅 Posted {new Date(job.created_at).toLocaleDateString('en-GB')}</span>
                  <span style={{ color: expired ? '#FF4444' : '#555', fontSize: '12px' }}>{expiryLabel}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <a href={`/jobs/edit/${job.id}`} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#ccc', fontSize: '12px', textDecoration: 'none', textAlign: 'center', fontWeight: 500 }}>Edit</a>

                {!job.is_featured && employer.plan === 'free' && (
                  <a href={`/employer/upgrade?job=${job.id}`} style={{ padding: '7px 14px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '20px', color: '#F5A623', fontSize: '12px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>⭐ Feature</a>
                )}

                {job.status === 'active' ? (
                  <button onClick={() => handleClose(job.id)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '20px', color: '#FFA500', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Close</button>
                ) : (
                  <button onClick={() => handleReopen(job.id)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '20px', color: '#2ECC71', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Reopen</button>
                )}

                <button onClick={() => handleDelete(job.id)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '20px', color: '#FF4444', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
              </div>
            </div>
          )
        })
      )}

      {toast && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', padding: '12px', borderRadius: '10px', background: toast.startsWith('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(46,204,113,0.1)', color: toast.startsWith('Error') ? '#FF4444' : '#2ECC71', border: `1px solid ${toast.startsWith('Error') ? 'rgba(255,68,68,0.2)' : 'rgba(46,204,113,0.2)'}` }}>
          {toast}
        </div>
      )}
    </div>
  )
}
