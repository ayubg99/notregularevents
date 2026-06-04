import type { Metadata } from'next'
import Link from'next/link'
import { notFound } from'next/navigation'
import { getAdminClient } from'@/lib/supabase/admin'
import type { JobListingRow } from'@/types/database'

export const dynamic ='force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('title, company_name, description, job_type, location, salary_text, hours_per_week')
    .eq('id', id)
    .single()

  if (!job) return { title:'Job Not Found | Erasmus Life' }

  const title =`${job.title} — ${job.company_name} | Erasmus Life Valencia`
  const description =
`${job.job_type.replace('_','')} position at` +
`${job.company_name} in ${job.location}.` +
`${job.salary_text ?`${job.salary_text}.` :''}` +
`${job.hours_per_week ?`${job.hours_per_week}h/week.` :''}` +
`Apply now on Erasmus Life.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:'website',
      url:`${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${id}`,
    },
    twitter: {
      card:'summary',
      title,
      description,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

function timeSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return'Today'
  if (days === 1) return'1 day ago'
  return`${days} days ago`
}

function langLabel(lang: JobListingRow['language_required']) {
  if (lang ==='both') return'English + Spanish'
  if (lang ==='english') return'English'
  if (lang ==='spanish') return'Spanish'
  return'Any language'
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

  const { data: similarJobs } = await admin
    .from('job_listings')
    .select('id, title, company_name, location, job_type')
    .eq('status','active')
    .eq('job_type', job.job_type)
    .neq('id', job.id)
    .limit(3)

  const jobSchema = {
'@context':'https://schema.org/',
'@type':'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
'@type':'PropertyValue',
      name: job.company_name,
      value: job.id,
    },
    datePosted: new Date(job.created_at).toISOString().split('T')[0],
    validThrough: new Date(job.expires_at).toISOString().split('T')[0],
    employmentType:
      job.job_type ==='part_time' ?'PART_TIME' :
      job.job_type ==='full_time' ?'FULL_TIME' :
      job.job_type ==='internship' ?'INTERN' :
      job.job_type ==='freelance' ?'CONTRACTOR' :
'OTHER',
    hiringOrganization: {
'@type':'Organization',
      name: job.company_name,
      sameAs: job.apply_url ||`${process.env.NEXT_PUBLIC_SITE_URL}/jobs`,
    },
    jobLocation: {
'@type':'Place',
      address: {
'@type':'PostalAddress',
        streetAddress: job.location ||'Valencia',
        addressLocality:'Valencia',
        addressRegion:'Valencia',
        addressCountry:'ES',
      },
    },
    ...(job.salary_text ? {
      baseSalary: {
'@type':'MonetaryAmount',
        currency:'EUR',
        value: {
'@type':'QuantitativeValue',
          value: job.salary_text,
          unitText:'MONTH',
        },
      },
    } : {}),
    ...(job.apply_email ? {
      applicationContact: {
'@type':'ContactPoint',
        email: job.apply_email,
        contactType:'Application',
      },
    } : {}),
  }

  return (
    <main className="min-h-screen pt-28 pb-28 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          href="/jobs"
          style={{
            display:'inline-flex',
            alignItems:'center',
            gap:'6px',
            color:'#888',
            textDecoration:'none',
            fontSize:'14px',
            marginBottom:'28px',
          }}
        >
          ← Back to Jobs
        </Link>

        <div className="job-detail-grid">

          {/* Left column (65%) */}
          <div style={{ flex:'1 1 0', minWidth: 0 }}>

            {/* Company + title header */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px' }}>
              <div
                style={{
                  width:'64px',
                  height:'64px',
                  borderRadius:'16px',
                  background:'rgba(255,255,255,0.06)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  flexShrink: 0,
                  overflow:'hidden',
                }}
              >
                {job.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.company_logo_url}
                    alt={job.company_name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                ) : (
                  <span style={{ color:'#FF6B00', fontWeight: 700, fontSize:'24px' }}>
                    {job.company_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p style={{ color:'#888', fontSize:'14px', margin:'0 0 4px' }}>{job.company_name}</p>
                <h1 style={{ color:'#fff', fontWeight: 700, fontSize:'22px', margin: 0 }}>{job.title}</h1>
              </div>
            </div>

            {/* Badges row */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
              <span
                style={{
                  background:'rgba(255,107,0,0.15)',
                  color:'#FF6B00',
                  padding:'4px 12px',
                  borderRadius:'20px',
                  fontSize:'12px',
                  fontWeight: 700,
                  textTransform:'uppercase',
                }}
              >
                {job.job_type.replace(/_/g,'')}
              </span>
              <span
                style={{
                  background:'rgba(255,255,255,0.06)',
                  color:'#ccc',
                  padding:'4px 12px',
                  borderRadius:'20px',
                  fontSize:'12px',
                  fontWeight: 600,
                  textTransform:'capitalize',
                }}
              >
                {job.category}
              </span>
              {job.is_urgent && (
                <span
                  style={{
                    background:'rgba(255,68,68,0.15)',
                    color:'#FF4444',
                    padding:'4px 12px',
                    borderRadius:'20px',
                    fontSize:'12px',
                    fontWeight: 700,
                  }}
                >
                   Urgent
                </span>
              )}
              {job.is_featured && (
                <span
                  style={{
                    background:'rgba(255,107,0,0.15)',
                    color:'#FF6B00',
                    padding:'4px 12px',
                    borderRadius:'20px',
                    fontSize:'12px',
                    fontWeight: 700,
                  }}
                >
                   Featured
                </span>
              )}
            </div>

            {/* Posted / expires */}
            <p style={{ color:'#555', fontSize:'13px', marginBottom:'28px' }}>
              Posted {timeSince(job.created_at)} · Expires {formatDate(job.expires_at)}
            </p>

            {/* Description */}
            <div
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'16px',
                padding:'24px',
                marginBottom:'20px',
              }}
            >
              <h2 style={{ color:'#fff', fontWeight: 700, fontSize:'16px', marginBottom:'14px' }}>
                Job Description
              </h2>
              <p style={{ color:'#ccc', fontSize:'15px', lineHeight: 1.7, whiteSpace:'pre-wrap', margin: 0 }}>
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div
                style={{
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'16px',
                  padding:'24px',
                }}
              >
                <h2 style={{ color:'#fff', fontWeight: 700, fontSize:'16px', marginBottom:'14px' }}>
                  Requirements
                </h2>
                <p style={{ color:'#ccc', fontSize:'15px', lineHeight: 1.7, whiteSpace:'pre-wrap', margin: 0 }}>
                  {job.requirements}
                </p>
              </div>
            )}

          </div>

          {/* Right column (35%) sticky */}
          <div className="job-detail-sidebar">
            <div
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'20px',
                padding:'24px',
              }}
            >
              {/* Company mini header */}
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                <div
                  style={{
                    width:'44px',
                    height:'44px',
                    borderRadius:'12px',
                    background:'rgba(255,255,255,0.06)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    overflow:'hidden',
                  }}
                >
                  {job.company_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  ) : (
                    <span style={{ color:'#FF6B00', fontWeight: 700, fontSize:'16px' }}>
                      {job.company_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ color:'#fff', fontWeight: 700, fontSize:'15px', margin: 0 }}>{job.company_name}</p>
                </div>
              </div>

              {/* Details */}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#888', fontSize:'14px' }}>
                  <span></span>
                  <span>{job.location}</span>
                </div>
                {job.hours_per_week && (
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#888', fontSize:'14px' }}>
                    <span></span>
                    <span>{job.hours_per_week}h/week</span>
                  </div>
                )}
                {job.salary_text && (
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#2ECC71', fontSize:'14px', fontWeight: 600 }}>
                    <span></span>
                    <span>{job.salary_text}</span>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#888', fontSize:'14px' }}>
                  <span></span>
                  <span>{langLabel(job.language_required)}</span>
                </div>
              </div>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'20px', display:'flex', flexDirection:'column' }}>

                {/* Apply by email */}
                {job.apply_email?.trim() && (
                  <>
                    <a
                      href={`mailto:${job.apply_email.trim()}?subject=${encodeURIComponent(`Application: ${job.title} — Erasmus Life`)}&body=${encodeURIComponent(`Hi ${job.contact_name ||'there'},\n\nI found your job posting"${job.title}" on Erasmus Life and I am interested in applying.\n\nName: \nNationality: \nUniversity: \nAvailable from: \n\nBest regards`)}`}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        gap:'10px',
                        background:'linear-gradient(135deg, #FF6B00, #E91E8C)',
                        color:'#1A1A0E',
                        padding:'16px 24px',
                        borderRadius:'50px',
                        textDecoration:'none',
                        fontWeight: 700,
                        fontSize:'15px',
                        width:'100%',
                        boxSizing:'border-box',
                        boxShadow:'0 4px 20px rgba(255,107,0,0.3)',
                        marginBottom:'12px',
                      }}
                    >
                       Apply by Email
                    </a>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'16px' }}>
                      <span style={{ color:'#555', fontSize:'12px' }}>Send to:</span>
                      <span style={{ color:'#888', fontSize:'12px', fontFamily:'monospace' }}>{job.apply_email.trim()}</span>
                    </div>
                  </>
                )}

                {/* Apply on WhatsApp */}
                {job.apply_whatsapp && (
                  <a
                    href={`https://wa.me/${job.apply_whatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`Hi! I found your job"${job.title}" on Erasmus Life and I am interested.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:'10px',
                      background:'#25D366',
                      color:'#fff',
                      padding:'14px 24px',
                      borderRadius:'50px',
                      textDecoration:'none',
                      fontWeight: 700,
                      fontSize:'14px',
                      width:'100%',
                      boxSizing:'border-box',
                      marginBottom:'12px',
                    }}
                  >
                     Apply on WhatsApp
                  </a>
                )}

                {/* Apply online */}
                {job.apply_url && (
                  <a
                    href={job.apply_url.startsWith('http') ? job.apply_url :`https://${job.apply_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:'10px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      color:'#fff',
                      padding:'13px 24px',
                      borderRadius:'50px',
                      textDecoration:'none',
                      fontWeight: 600,
                      fontSize:'14px',
                      width:'100%',
                      boxSizing:'border-box',
                      marginBottom:'12px',
                    }}
                  >
                     Apply Online
                  </a>
                )}
              </div>

              {/* Meta */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'12px', marginTop:'4px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ color:'#555', fontSize:'12px' }}>Posted</span>
                  <span style={{ color:'#888', fontSize:'12px' }}>{formatDate(job.created_at)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#555', fontSize:'12px' }}>Expires</span>
                  <span style={{ color: new Date(job.expires_at) < new Date() ?'#FF4444' :'#888', fontSize:'12px' }}>{formatDate(job.expires_at)}</span>
                </div>
              </div>
            </div>

            {/* Post a job CTA */}
            <div style={{ textAlign:'center', marginTop:'16px' }}>
              <Link href="/jobs/post" style={{ color:'#888', fontSize:'13px', textDecoration:'none' }}>
                Want to hire? <span style={{ color:'#FF6B00' }}>Post a job →</span>
              </Link>
            </div>

            {/* Similar jobs */}
            {similarJobs && similarJobs.length > 0 && (
              <div style={{ marginTop:'24px' }}>
                <h3 style={{ color:'#fff', fontSize:'16px', fontWeight: 700, margin:'0 0 12px' }}>
                  Similar Jobs
                </h3>
                {similarJobs.map(similar => (
                  <Link
                    key={similar.id}
                    href={`/jobs/${similar.id}`}
                    style={{
                      display:'block',
                      background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.07)',
                      borderRadius:'12px',
                      padding:'16px',
                      textDecoration:'none',
                      marginBottom:'10px',
                    }}
                  >
                    <p style={{ color:'#FF6B00', fontSize:'11px', fontWeight: 700, textTransform:'uppercase', margin:'0 0 6px' }}>
                      {similar.job_type.replace(/_/g,'')}
                    </p>
                    <p style={{ color:'#fff', fontWeight: 600, fontSize:'14px', margin:'0 0 4px' }}>
                      {similar.title}
                    </p>
                    <p style={{ color:'#888', fontSize:'13px', margin: 0 }}>
                      {similar.company_name} • {similar.location}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
