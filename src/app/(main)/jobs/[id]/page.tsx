import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase/admin'
import type { JobListingRow } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('title, company_name, description')
    .eq('id', id)
    .single()

  if (!job) return { title: 'Job Not Found | Erasmus Vibe' }

  return {
    title: `${job.title} at ${job.company_name} | Erasmus Vibe`,
    description: job.description.slice(0, 160),
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function langLabel(lang: JobListingRow['language_required']) {
  if (lang === 'both')    return 'English + Spanish'
  if (lang === 'english') return 'English'
  if (lang === 'spanish') return 'Spanish'
  return 'Any language'
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Increment views (fire-and-forget)
  admin
    .from('job_listings')
    .update({ views: job.views + 1 })
    .eq('id', id)
    .then(() => {})

  const whatsappNumber = job.apply_whatsapp?.replace(/[^0-9]/g, '') ?? ''

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          href="/jobs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#888',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '28px',
          }}
        >
          ← Back to Jobs
        </Link>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

          {/* ── Left column (65%) ─────────────────────────────── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            {/* Company + title header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {job.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.company_logo_url}
                    alt={job.company_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '24px' }}>
                    {job.company_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '14px', margin: '0 0 4px' }}>{job.company_name}</p>
                <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '22px', margin: 0 }}>{job.title}</h1>
              </div>
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span
                style={{
                  background: 'rgba(245,166,35,0.15)',
                  color: '#F5A623',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {job.job_type.replace(/_/g, ' ')}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ccc',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {job.category}
              </span>
              {job.is_urgent && (
                <span
                  style={{
                    background: 'rgba(255,68,68,0.15)',
                    color: '#FF4444',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  🔥 Urgent
                </span>
              )}
              {job.is_featured && (
                <span
                  style={{
                    background: 'rgba(245,166,35,0.15)',
                    color: '#F5A623',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ⭐ Featured
                </span>
              )}
            </div>

            {/* Posted / expires */}
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '28px' }}>
              Posted {timeSince(job.created_at)} · Expires {formatDate(job.expires_at)}
            </p>

            {/* Description */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
                Job Description
              </h2>
              <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
                  Requirements
                </h2>
                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {job.requirements}
                </p>
              </div>
            )}
          </div>

          {/* ── Right column (35%) sticky ──────────────────────── */}
          <div style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '100px' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              {/* Company mini header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {job.company_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '16px' }}>
                      {job.company_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>{job.company_name}</p>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '14px' }}>
                  <span>📍</span>
                  <span>{job.location}</span>
                </div>
                {job.hours_per_week && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '14px' }}>
                    <span>🕐</span>
                    <span>{job.hours_per_week}h/week</span>
                  </div>
                )}
                {job.salary_text && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2ECC71', fontSize: '14px', fontWeight: 600 }}>
                    <span>💶</span>
                    <span>{job.salary_text}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '14px' }}>
                  <span>🗣️</span>
                  <span>{langLabel(job.language_required)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Apply by email */}
                {job.apply_email && (
                  <a
                    href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Application: ${job.title} — Erasmus Vibe`)}&body=${encodeURIComponent(`Hi ${job.contact_name || 'there'},\n\nI found your job posting "${job.title}" on Erasmus Vibe and I am interested in applying.\n\nName: \nNationality: \nUniversity: \nAvailable from: \n\nBest regards`)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #F5A623, #FF6B35)',
                      color: '#1A1A0E',
                      padding: '15px 24px',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '15px',
                      marginBottom: '10px',
                      boxShadow: '0 4px 16px rgba(245,166,35,0.25)',
                    }}
                  >
                    📧 Apply by Email
                  </a>
                )}

                {/* Apply on WhatsApp */}
                {job.apply_whatsapp && (
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${job.contact_name || 'there'}! I found your job posting "${job.title}" on Erasmus Vibe and I am interested. Is the position still available?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#25D366',
                      color: '#fff',
                      padding: '15px 24px',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '15px',
                      marginBottom: '10px',
                    }}
                  >
                    💬 Apply on WhatsApp
                  </a>
                )}

                {/* Apply online */}
                {job.apply_url && (
                  <a
                    href={job.apply_url.startsWith('http') ? job.apply_url : `https://${job.apply_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      padding: '14px 24px',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.1)',
                      marginBottom: '10px',
                    }}
                  >
                    🌐 Apply Online
                  </a>
                )}
              </div>

              {/* Meta */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 4px' }}>
                  Posted: {timeSince(job.created_at)}
                </p>
                <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                  Expires: {formatDate(job.expires_at)}
                </p>
              </div>
            </div>

            {/* Post a job CTA */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/jobs/post" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>
                Want to hire? <span style={{ color: '#F5A623' }}>Post a job →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
