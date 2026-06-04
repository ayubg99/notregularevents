'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JobListingRow, JobLanguage } from '@/types/database'

interface Props {
  job:   JobListingRow
  token: string | null
}

const inputStyle: React.CSSProperties = {
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding:      '10px 14px',
  color:        '#fff',
  fontSize:     '14px',
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
}

const labelStyle: React.CSSProperties = {
  color:        '#ccc',
  fontSize:     '13px',
  fontWeight:   600,
  marginBottom: '6px',
  display:      'block',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export default function EditJobClient({ job, token }: Props) {
  const router = useRouter()

  const [title,      setTitle]      = useState(job.title)
  const [location,   setLocation]   = useState(job.location)
  const [hours,      setHours]      = useState(job.hours_per_week?.toString() ?? '')
  const [salary,     setSalary]     = useState(job.salary_text ?? '')
  const [language,   setLanguage]   = useState<JobLanguage>(job.language_required)
  const [desc,       setDesc]       = useState(job.description)
  const [reqs,       setReqs]       = useState(job.requirements ?? '')
  const [contact,    setContact]    = useState(job.contact_name ?? '')
  const [applyEmail, setApplyEmail] = useState(job.apply_email ?? '')
  const [applyWA,    setApplyWA]    = useState(job.apply_whatsapp ?? '')
  const [applyUrl,   setApplyUrl]   = useState(job.apply_url ?? '')

  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim())   { setError('Title is required.'); return }
    if (!desc.trim())    { setError('Description is required.'); return }
    if (!contact.trim()) { setError('Contact name is required.'); return }
    if (!applyEmail.trim() && !applyWA.trim() && !applyUrl.trim()) {
      setError('At least one apply method is required.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          token,
          title:             title.trim(),
          location:          location.trim(),
          hours_per_week:    hours ? parseInt(hours, 10) : null,
          salary_text:       salary.trim() || null,
          language_required: language,
          description:       desc.trim(),
          requirements:      reqs.trim() || null,
          contact_name:      contact.trim(),
          apply_email:       applyEmail.trim() || null,
          apply_whatsapp:    applyWA.trim()    || null,
          apply_url:         applyUrl.trim()   || null,
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to save. Please try again.')
        return
      }

      router.push(`/jobs/${job.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background:   'rgba(255,255,255,0.03)',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding:      '28px',
        maxWidth:     '680px',
        margin:       '0 auto',
      }}
    >
      {/* Locked info banner */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' }}>
        <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
          Locked: <strong style={{ color: '#888' }}>{job.company_name}</strong> · {job.job_type.replace(/_/g, ' ')} · {job.category}
        </p>
      </div>

      <Field label="Job Title">
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Location">
          <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} />
        </Field>
        <Field label="Hours per Week">
          <input style={inputStyle} type="number" min="1" max="168" value={hours} onChange={e => setHours(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Salary / Compensation">
          <input style={inputStyle} value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. €800/month" />
        </Field>
        <Field label="Language Required">
          <select style={inputStyle} value={language} onChange={e => setLanguage(e.target.value as JobLanguage)}>
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="both">Both (EN + ES)</option>
            <option value="any">Any language</option>
          </select>
        </Field>
      </div>

      <Field label="Job Description">
        <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={desc} onChange={e => setDesc(e.target.value)} />
      </Field>

      <Field label="Requirements">
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={reqs} onChange={e => setReqs(e.target.value)} />
      </Field>

      <Field label="Contact Name">
        <input style={inputStyle} value={contact} onChange={e => setContact(e.target.value)} />
      </Field>

      <Field label="Apply by Email">
        <input style={inputStyle} type="email" value={applyEmail} onChange={e => setApplyEmail(e.target.value)} />
      </Field>

      <Field label="Apply by WhatsApp">
        <input style={inputStyle} type="tel" value={applyWA} onChange={e => setApplyWA(e.target.value)} />
      </Field>

      <Field label="Apply Online (URL)">
        <input style={inputStyle} type="url" value={applyUrl} onChange={e => setApplyUrl(e.target.value)} />
      </Field>

      {error && (
        <p style={{ color: '#FF4444', fontSize: '13px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <a
          href={`/jobs/${job.id}`}
          style={{ padding: '12px 24px', borderRadius: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
        >
          Cancel
        </a>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ padding: '12px 28px', borderRadius: '50px', background: loading ? 'rgba(255,107,0,0.5)' : '#FF6B00', border: 'none', color: '#0D0D0D', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
