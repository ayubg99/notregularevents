'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { JobListingRow } from '@/types/database'

interface Props {
  myJobs: JobListingRow[]
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function JobListings({ myJobs }: Props) {
  const [jobs,  setJobs]  = useState<JobListingRow[]>(myJobs)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function patch(id: string, fields: Record<string, unknown>) {
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
    if (!await patch(id, { status: 'closed' })) return
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed' } : j))
    setToast('Job listing closed')
  }

  async function handleReopen(id: string) {
    const job = jobs.find(j => j.id === id)
    if (job && new Date(job.expires_at) < new Date()) {
      setToast('Listing expired — post a new one')
      return
    }
    if (!await patch(id, { status: 'active' })) return
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'active' } : j))
    setToast('Job listing reopened')
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
    setToast('Job listing deleted')
  }

  if (jobs.length === 0) return null

  return (
    <div className="glass-card rounded-2xl p-6">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="font-heading" style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
          💼 My Job Listings
        </h2>
        <Link
          href="/jobs/post"
          style={{
            padding:        '8px 16px',
            background:     '#F5A623',
            color:          '#1A1A2E',
            borderRadius:   '50px',
            textDecoration: 'none',
            fontWeight:     700,
            fontSize:       '13px',
          }}
        >
          + Post a Job
        </Link>
      </div>

      {/* Job cards */}
      {jobs.map(job => (
        <div
          key={job.id}
          style={{
            background:    'rgba(255,255,255,0.03)',
            border:        '1px solid rgba(255,255,255,0.08)',
            borderRadius:  '16px',
            padding:       '20px',
            marginBottom:  '12px',
            display:       'flex',
            justifyContent:'space-between',
            alignItems:    'flex-start',
            gap:           '12px',
          }}
        >
          {/* Left: info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {job.job_type.replace(/_/g, ' ')}
              </span>
              <span style={{
                background: job.status === 'active' ? 'rgba(46,204,113,0.15)' :
                            job.status === 'draft'  ? 'rgba(245,166,35,0.15)' :
                            'rgba(255,68,68,0.15)',
                color:      job.status === 'active' ? '#2ECC71' :
                            job.status === 'draft'  ? '#F5A623' :
                            '#FF4444',
                padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              }}>
                ● {job.status}
              </span>
              {job.is_featured && (
                <span style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  ⭐ Featured
                </span>
              )}
              {job.is_urgent && (
                <span style={{ background: 'rgba(255,68,68,0.15)', color: '#FF4444', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  🔥 Urgent
                </span>
              )}
            </div>

            {/* Title */}
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.title}
            </p>

            {/* Company */}
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px' }}>
              {job.company_name}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ color: '#555', fontSize: '12px' }}>👁️ {job.views} views</span>
              <span style={{ color: '#555', fontSize: '12px' }}>Expires {formatExpiry(job.expires_at)}</span>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <a
              href={`/jobs/edit/${job.id}`}
              style={{
                padding:        '7px 14px',
                background:     'rgba(255,255,255,0.05)',
                border:         '1px solid rgba(255,255,255,0.1)',
                borderRadius:   '20px',
                color:          '#ccc',
                fontSize:       '12px',
                textDecoration: 'none',
                textAlign:      'center',
                fontWeight:     500,
              }}
            >
              Edit
            </a>

            {job.status === 'active' && (
              <button
                onClick={() => handleClose(job.id)}
                style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '20px', color: '#F5A623', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
            )}

            {job.status === 'closed' && (
              <button
                onClick={() => handleReopen(job.id)}
                style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '20px', color: '#2ECC71', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
              >
                Reopen
              </button>
            )}

            <button
              onClick={() => handleDelete(job.id)}
              style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '20px', color: '#FF4444', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Toast */}
      {toast && (
        <div style={{
          marginTop:  '16px',
          textAlign:  'center',
          fontSize:   '13px',
          padding:    '10px',
          borderRadius: '10px',
          background: toast.startsWith('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(46,204,113,0.1)',
          color:      toast.startsWith('Error') ? '#FF4444' : '#2ECC71',
          border:     `1px solid ${toast.startsWith('Error') ? 'rgba(255,68,68,0.2)' : 'rgba(46,204,113,0.2)'}`,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
