'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/admin/ImageUpload'
import type { JobType, JobCategory, JobLanguage } from '@/types/database'

type BasePlan = 'standard' | 'featured' | 'employer_plan'

interface FormData {
  // Step 1
  title:             string
  company_name:      string
  company_logo_url:  string
  job_type:          JobType
  category:          JobCategory
  location:          string
  hours_per_week:    string
  salary_text:       string
  language_required: JobLanguage
  // Step 2
  description:       string
  requirements:      string
  // Step 3
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

const STEPS = ['Job Details', 'Description', 'How to Apply', 'Listing Options']

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

const BASE_PLANS: Array<{
  id:       BasePlan
  icon:     string
  title:    string
  price:    string
  sub:      string
  features: string[]
  popular?: boolean
}> = [
  {
    id:       'standard',
    icon:     '🆓',
    title:    'Standard',
    price:    'Free',
    sub:      'One listing',
    features: ['Active for 30 days', 'Normal position in results'],
  },
  {
    id:       'featured',
    icon:     '⭐',
    title:    'Featured',
    price:    '€29',
    sub:      'one-time',
    features: ['Active for 60 days', 'Appears first in results', 'Highlighted card'],
    popular:  true,
  },
  {
    id:       'employer_plan',
    icon:     '🏢',
    title:    'Employer Plan',
    price:    '€49',
    sub:      '/month',
    features: ['Unlimited job postings', 'All listings featured automatically', 'Best for regular hirers'],
  },
]

export default function PostJobClient() {
  const router = useRouter()
  const [step,       setStep]       = useState(0)
  const [form,       setForm]       = useState<FormData>(INITIAL)
  const [basePlan,   setBasePlan]   = useState<BasePlan>('standard')
  const [withUrgent, setWithUrgent] = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

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
    setError('')
    setLoading(true)

    try {
      const isFreeTotal = basePlan === 'standard' && !withUrgent

      // Always create the job first to get a jobId
      const res  = await fetch('/api/jobs/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, basePlan, withUrgent }),
      })
      const data = await res.json() as { jobId?: string; error?: string }

      if (!res.ok || !data.jobId) {
        setError(data.error ?? 'Failed to create listing. Please try again.')
        return
      }

      const { jobId } = data

      if (isFreeTotal) {
        router.push(`/jobs/${jobId}?posted=true`)
        return
      }

      // Paid path — go to Stripe
      const checkoutType = basePlan === 'employer_plan' ? 'employer_subscription' : 'job_listing'

      const checkoutRes  = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:       checkoutType,
          itemId:     jobId,
          basePlan,
          withUrgent,
        }),
      })
      const checkoutData = await checkoutRes.json() as { url?: string; error?: string }

      if (!checkoutRes.ok || !checkoutData.url) {
        setError(checkoutData.error ?? 'Payment setup failed. Please try again.')
        return
      }

      window.location.href = checkoutData.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFreeTotal   = basePlan === 'standard' && !withUrgent
  const submitLabel   = loading
    ? 'Submitting...'
    : isFreeTotal
      ? 'Post Job for Free'
      : basePlan === 'employer_plan'
        ? 'Continue to Subscription →'
        : 'Continue to Payment →'

  const urgentFee = basePlan === 'employer_plan' ? 'Included free' : '+€9'

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height:     '4px',
                borderRadius: '4px',
                background:  i <= step ? '#F5A623' : 'rgba(255,255,255,0.1)',
                marginBottom: '6px',
                transition:  'background 0.2s',
              }}
            />
            <span style={{ color: i === step ? '#F5A623' : '#555', fontSize: '11px', fontWeight: 600 }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          background:   'rgba(255,255,255,0.03)',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding:      '28px',
        }}
      >
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '20px', margin: '0 0 24px' }}>
          Step {step + 1}: {STEPS[step]}
        </h2>

        {/* ── Step 1: Job Details ─────────────────────────────── */}
        {step === 0 && (
          <div>
            <Field label="Job Title" required>
              <input style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Waiter / Waitress" />
            </Field>

            <Field label="Company Name" required>
              <input style={inputStyle} value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="e.g. La Pepica Restaurant" />
            </Field>

            <Field label="Company Logo (optional)">
              <ImageUpload
                value={form.company_logo_url}
                onChange={url => update('company_logo_url', url)}
                folder="jobs"
              />
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

        {/* ── Step 2: Description ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <Field label="Job Description" required>
              <textarea
                style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe the role, day-to-day responsibilities, work environment..."
              />
            </Field>

            <Field label="Requirements">
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={form.requirements}
                onChange={e => update('requirements', e.target.value)}
                placeholder="Skills, experience, documents needed..."
              />
            </Field>
          </div>
        )}

        {/* ── Step 3: How to Apply ────────────────────────────── */}
        {step === 2 && (
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              Provide at least one way for candidates to apply.
            </p>

            <Field label="Your Name / Contact Name" required>
              <input style={inputStyle} value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="e.g. Maria García" />
            </Field>

            <Field label="Apply by Email">
              <input style={inputStyle} type="email" value={form.apply_email} onChange={e => update('apply_email', e.target.value)} placeholder="jobs@yourcompany.com" />
            </Field>

            <Field label="Apply by WhatsApp (number with country code)">
              <input style={inputStyle} type="tel" value={form.apply_whatsapp} onChange={e => update('apply_whatsapp', e.target.value)} placeholder="+34 612 345 678" />
            </Field>

            <Field label="Apply Online (URL)">
              <input style={inputStyle} type="url" value={form.apply_url} onChange={e => update('apply_url', e.target.value)} placeholder="https://yourcompany.com/jobs" />
            </Field>
          </div>
        )}

        {/* ── Step 4: Listing Options ─────────────────────────── */}
        {step === 3 && (
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              Choose how you&apos;d like your listing to appear on Erasmus Vibe.
            </p>

            {/* Base plan cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {BASE_PLANS.map(plan => {
                const active = basePlan === plan.id
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setBasePlan(plan.id)}
                    style={{
                      background:     active ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.02)',
                      border:         active ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius:   '14px',
                      padding:        '16px 20px',
                      cursor:         'pointer',
                      textAlign:      'left',
                      transition:     'all 0.15s',
                      position:       'relative',
                    }}
                  >
                    {/* Most popular badge */}
                    {plan.popular && (
                      <span
                        style={{
                          position:   'absolute',
                          top:        '-1px',
                          right:      '16px',
                          background: '#F5A623',
                          color:      '#1A1A2E',
                          fontSize:   '10px',
                          fontWeight: 800,
                          padding:    '3px 10px',
                          borderRadius: '0 0 8px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Most popular
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '22px', lineHeight: 1 }}>{plan.icon}</span>
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>
                            {plan.title}
                          </p>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {plan.features.map(f => (
                              <li key={f} style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: active ? '#F5A623' : '#444', fontSize: '10px' }}>✓</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ color: plan.id === 'standard' ? '#2ECC71' : '#F5A623', fontWeight: 800, fontSize: '20px' }}>
                          {plan.price}
                        </span>
                        <span style={{ color: '#555', fontSize: '12px', display: 'block' }}>
                          {plan.sub}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Urgent add-on */}
            <button
              type="button"
              onClick={() => {
                if (basePlan !== 'employer_plan') setWithUrgent(v => !v)
              }}
              style={{
                width:        '100%',
                background:   (withUrgent || basePlan === 'employer_plan') ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                border:       (withUrgent || basePlan === 'employer_plan') ? '2px solid rgba(255,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding:      '14px 20px',
                cursor:       basePlan === 'employer_plan' ? 'default' : 'pointer',
                textAlign:    'left',
                display:      'flex',
                alignItems:   'center',
                gap:          '14px',
                transition:   'all 0.15s',
              }}
            >
              {/* Checkbox visual */}
              <div
                style={{
                  width:        '20px',
                  height:       '20px',
                  borderRadius: '6px',
                  border:       (withUrgent || basePlan === 'employer_plan') ? '2px solid #FF4444' : '2px solid rgba(255,255,255,0.2)',
                  background:   (withUrgent || basePlan === 'employer_plan') ? 'rgba(255,68,68,0.2)' : 'transparent',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  flexShrink:   0,
                  fontSize:     '12px',
                }}
              >
                {(withUrgent || basePlan === 'employer_plan') && '✓'}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔥 Add Urgent badge
                  <span style={{ color: '#FF4444', fontSize: '13px', fontWeight: 600 }}>
                    {urgentFee}
                  </span>
                </p>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Red &quot;Urgent&quot; badge · &quot;Hiring now&quot; label · Add to any plan
                </p>
              </div>
            </button>

            {/* Price summary */}
            <div
              style={{
                marginTop:    '16px',
                padding:      '12px 16px',
                borderRadius: '10px',
                background:   'rgba(255,255,255,0.03)',
                border:       '1px solid rgba(255,255,255,0.06)',
                display:      'flex',
                justifyContent: 'space-between',
                alignItems:   'center',
              }}
            >
              <span style={{ color: '#888', fontSize: '13px' }}>Total today</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                {basePlan === 'standard' && !withUrgent && 'Free'}
                {basePlan === 'standard' && withUrgent && '€9'}
                {basePlan === 'featured' && !withUrgent && '€29'}
                {basePlan === 'featured' && withUrgent && '€38'}
                {basePlan === 'employer_plan' && '€49/month'}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: '#FF4444', fontSize: '13px', marginTop: '16px', background: 'rgba(255,68,68,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => { setError(''); setStep(s => s - 1) }}
              style={{
                background:   'rgba(255,255,255,0.05)',
                border:       '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50px',
                padding:      '12px 24px',
                color:        '#fff',
                fontWeight:   600,
                cursor:       'pointer',
                fontSize:     '14px',
              }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                background:   '#F5A623',
                border:       'none',
                borderRadius: '50px',
                padding:      '12px 28px',
                color:        '#1A1A2E',
                fontWeight:   700,
                cursor:       'pointer',
                fontSize:     '14px',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background:   loading ? 'rgba(245,166,35,0.5)' : '#F5A623',
                border:       'none',
                borderRadius: '50px',
                padding:      '12px 28px',
                color:        '#1A1A2E',
                fontWeight:   700,
                cursor:       loading ? 'not-allowed' : 'pointer',
                fontSize:     '14px',
              }}
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
