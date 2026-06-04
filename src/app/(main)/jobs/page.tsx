import type { Metadata } from'next'
import Link from'next/link'
import { getAdminClient } from'@/lib/supabase/admin'
import JobsClient from'@/components/jobs/JobsClient'

export const dynamic ='force-dynamic'

export const metadata: Metadata = {
  title:'Jobs for Erasmus Students in Valencia | Erasmus Life',
  description:
'Find part-time jobs, internships and' +
'opportunities for Erasmus students' +
'in Valencia, Spain. English-friendly employers.',
  openGraph: {
    title:'Jobs for Erasmus Students in Valencia',
    description:
'Part-time jobs and internships for' +
'Erasmus students in Valencia.',
    type:'website',
  },
}

export default async function JobsPage() {
  const admin = getAdminClient()
  const { data: jobs } = await admin
    .from('job_listings')
    .select('*')
    .eq('status','active')
    .gt('expires_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Jobs for Erasmus Students in Valencia 
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
            Part-time jobs, internships and opportunities that work around your Erasmus schedule. English-friendly employers.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="#jobs-list"
              style={{
                display:'inline-flex',
                alignItems:'center',
                padding:'12px 28px',
                borderRadius:'50px',
                background:'#FF6B00',
                color:'#0D0D0D',
                fontWeight: 700,
                textDecoration:'none',
                fontSize:'15px',
              }}
            >
              Browse Jobs
            </a>
            <Link
              href="/jobs/post"
              style={{
                display:'inline-flex',
                alignItems:'center',
                padding:'12px 28px',
                borderRadius:'50px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.15)',
                color:'#fff',
                fontWeight: 600,
                textDecoration:'none',
                fontSize:'15px',
              }}
            >
              Post a Job →
            </Link>
          </div>
        </div>

        <JobsClient jobs={jobs ?? []} />
      </div>
    </main>
  )
}
