'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { JobListingRow } from '@/types/database'

interface Props {
  job:   JobListingRow
  token: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ManageJobClient({ job: initial, token }: Props) {
  const [job,   setJob]   = useState(initial)
  const [toast, setToast] = useState('')
  const [gone,  setGone]  = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function patch(fields: Record<string, unknown>) {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, ...fields }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (!res.ok) { setToast('Error: ' + (data.error ?? 'Failed')); return false }
    return true
  }

  async function handleClose() {
    if (!await patch({ status: 'closed' })) return
    setJob(j => ({ ...j, status: 'closed' }))
    setToast('Listing closed')
  }

  async function handleReopen() {
    if (new Date(job.expires_at) < new Date()) { setToast('Listing expired — post a new one'); return }
    if (!await patch({ status: 'active' })) return
    setJob(j => ({ ...j, status: 'active' }))
    setToast('Listing reopened')
  }

  async function handleDelete() {
    if (!confirm('Delete this job listing permanently?')) return
    const res = await fetch(`/api/jobs/${job.id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }
    if (!res.ok) { setToast('Error: ' + (data.error ?? 'Failed')); return }
    setGone(true)
    setToast('Job listing deleted')
  }

  if (gone) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>✅</p>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Listing deleted</p>
        <Link href="/jobs" style={{ color: '#F5A623', fontSize: '14px' }}>Browse other jobs</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>

      {/* Job summary card */}
      <div
        style={{
          background:   'rgba(255,255,255,0.03)',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding:      '24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
          {/* Logo */}
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {job.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.company_logo_url} alt={job.company_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '18px' }}>{job.company_name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 4px' }}>{job.company_name}</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>{job.title}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ color: '#888', fontSize: '13px' }}>👁️ {job.views} views</span>
          <span style={{
            background: job.status === 'active' ? 'rgba(46,204,113,0.15)' : job.status === 'draft' ? 'rgba(245,166,35,0.15)' : 'rgba(255,68,68,0.15)',
            color:      job.status === 'active' ? '#2ECC71' : job.status === 'draft' ? '#F5A623' : '#FF4444',
            padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
          }}>
            ● {job.status}
          </span>
          {job.is_featured && <span style={{ color: '#F5A623', fontSize: '12px', fontWeight: 700 }}>⭐ Featured</span>}
          {job.is_urgent   && <span style={{ color: '#FF4444', fontSize: '12px', fontWeight: 700 }}>🔥 Urgent</span>}
        </div>

        <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
          Expires: {formatDate(job.expires_at)}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <a
          href={`/jobs/edit/${job.id}?token=${token}`}
          style={{ display: 'block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', padding: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600, textAlign: 'center', fontSize: '14px' }}
        >
          ✏️ Edit Listing
        </a>

        <a
          href={`/jobs/${job.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', padding: '13px', color: '#888', textDecoration: 'none', textAlign: 'center', fontSize: '14px' }}
        >
          👁️ View Public Listing
        </a>

        {job.status === 'active' && (
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '50px', padding: '13px', color: '#F5A623', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            ⏸ Close Listing
          </button>
        )}

        {job.status === 'closed' && (
          <button
            onClick={handleReopen}
            style={{ background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '50px', padding: '13px', color: '#2ECC71', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            ▶ Reopen Listing
          </button>
        )}

        <button
          onClick={handleDelete}
          style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '50px', padding: '13px', color: '#FF4444', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          🗑 Delete Listing
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          marginTop:    '20px',
          textAlign:    'center',
          fontSize:     '13px',
          padding:      '12px',
          borderRadius: '10px',
          background:   toast.startsWith('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(46,204,113,0.1)',
          color:        toast.startsWith('Error') ? '#FF4444' : '#2ECC71',
          border:       `1px solid ${toast.startsWith('Error') ? 'rgba(255,68,68,0.2)' : 'rgba(46,204,113,0.2)'}`,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
