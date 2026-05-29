'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/admin/ImageUpload'
import type { JobType, JobCategory, JobLanguage } from '@/types/database'

interface Props {
  employerId: string
}

interface FormData {
  title:             string
  company_name:      string
  company_logo_url:  string
  job_type:          JobType
  category:          JobCategory
  location:          string
  hours_per_week:    string
  salary_text:       string
  language_required: JobLanguage
  description:       string
  requirements:      string
  contact_name:      string
  apply_email:       string
  apply_whatsapp:    string
  apply_url:         string
}

const INITIAL: FormData = {
  title:             '',
  company_name:      '',
  company_logo_url:  '',
  job_type:          'part_time',
  category:          'other',
  location:          'Valencia, Spain',
  hours_per_week:    '',
  salary_text:       '',
  language_required: 'english',
  description:       '',
  requirements:      '',
  contact_name:      '',
  apply_email:       '',
  apply_whatsapp:    '',
  apply_url:         '',
}

const STEPS = ['Job Details', 'Description', 'How to Apply']

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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#FF6B35' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function PostJobClient({ employerId }: Props) {
  const router = useRouter()
  const [step,    setStep]    = useState(0)
  const [form,    setForm]    = useState<FormData>(INITIAL)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validateStep(): string {
    if (step === 0) {
      if (!form.title.trim())        return 'Job title is required.'
      if (!form.company_name.trim()) return 'Company name is required.'
    }
    if (step === 1) {
      if (!form.description.trim()) return 'Job description is required.'
    }
    if (step === 2) {
      if (!form.contact_name.trim()) return 'Contact name is required.'
      if (!form.apply_email.trim() && !form.apply_whatsapp.trim() && !form.apply_url.trim()) {
        return 'At least one apply method (email, WhatsApp, or URL) is required.'
      }
    }
    return ''
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    const err = validateStep()
    if (err) { setError(err); return }

    setError('')
    setLoading(true)

    try {
      const res  = await fetch('/api/jobs/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, employerId }),
      })
      const data = await res.json() as { jobId?: string; error?: string }

      if (!res.ok || !data.jobId) {
        setError(data.error ?? 'Failed to create listing. Please try again.')
        return
      }

      router.push('/employer/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '4px', borderRadius: '4px', background: i <= step ? '#F5A623' : 'rgba(255,255,255,0.1)', marginBottom: '6px', transition: 'background 0.2s' }} />
            <span style={{ color: i === step ? '#F5A623' : '#555', fontSize: '11px', fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px' }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '20px', margin: '0 0 24px' }}>
          Step {step + 1}: {STEPS[step]}
        </h2>

        {/* Step 1: Job Details */}
        {step === 0 && (
          <div>
            <Field label="Job Title" required>
              <input style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Waiter / Waitress" />
            </Field>
            <Field label="Company Name" required>
              <input style={inputStyle} value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="e.g. La Pepica Restaurant" />
            </Field>
            <Field label="Company Logo (optional)">
              <ImageUpload value={form.company_logo_url} onChange={url => update('company_logo_url', url)} folder="jobs" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Job Type" required>
                <select style={inputStyle} value={form.job_type} onChange={e => update('job_type', e.target.value as JobType)}>
                  <option value="part_time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="full_time">Full-time</option>
                  <option value="freelance">Freelance</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </Field>
              <Field label="Category" required>
                <select style={inputStyle} value={form.category} onChange={e => update('category', e.target.value as JobCategory)}>
                  <option value="hospitality">Hospitality</option>
                  <option value="marketing">Marketing</option>
                  <option value="tech">Tech</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="events">Events</option>
                  <option value="language">Language</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            <Field label="Location">
              <input style={inputStyle} value={form.location} onChange={e => update('location', e.target.value)} placeholder="Valencia, Spain" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Hours per Week">
                <input style={inputStyle} type="number" min="1" max="168" value={form.hours_per_week} onChange={e => update('hours_per_week', e.target.value)} placeholder="e.g. 20" />
              </Field>
              <Field label="Salary / Compensation">
                <input style={inputStyle} value={form.salary_text} onChange={e => update('salary_text', e.target.value)} placeholder="e.g. €800/month" />
              </Field>
            </div>
            <Field label="Language Required">
              <select style={inputStyle} value={form.language_required} onChange={e => update('language_required', e.target.value as JobLanguage)}>
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="both">Both (English + Spanish)</option>
                <option value="any">Any language</option>
              </select>
            </Field>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 1 && (
          <div>
            <Field label="Job Description" required>
              <textarea style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe the role, responsibilities, work environment..." />
            </Field>
            <Field label="Requirements">
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.requirements} onChange={e => update('requirements', e.target.value)} placeholder="Skills, experience, documents needed..." />
            </Field>
          </div>
        )}

        {/* Step 3: How to Apply */}
        {step === 2 && (
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>Provide at least one way for candidates to apply.</p>
            <Field label="Your Name / Contact Name" required>
              <input style={inputStyle} value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="e.g. Maria García" />
            </Field>
            <Field label="Apply by Email">
              <input style={inputStyle} type="email" value={form.apply_email} onChange={e => update('apply_email', e.target.value)} placeholder="jobs@yourcompany.com" />
            </Field>
            <Field label="Apply by WhatsApp">
              <input style={inputStyle} type="tel" value={form.apply_whatsapp} onChange={e => update('apply_whatsapp', e.target.value)} placeholder="+34 612 345 678" />
            </Field>
            <Field label="Apply Online (URL)">
              <input style={inputStyle} type="url" value={form.apply_url} onChange={e => update('apply_url', e.target.value)} placeholder="https://yourcompany.com/jobs" />
            </Field>
          </div>
        )}

        {error && (
          <p style={{ color: '#FF4444', fontSize: '13px', marginTop: '16px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px', padding: '10px 14px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
          {step > 0 ? (
            <button type="button" onClick={() => { setError(''); setStep(s => s - 1) }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50px', padding: '12px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext} style={{ background: '#F5A623', border: 'none', borderRadius: '50px', padding: '12px 28px', color: '#1A1A2E', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: loading ? 'rgba(245,166,35,0.5)' : '#F5A623', border: 'none', borderRadius: '50px', padding: '12px 28px', color: '#1A1A2E', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              {loading ? 'Posting…' : 'Post Job →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
