import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import ManageJobClient from '@/components/jobs/ManageJobClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Manage Job Listing | Erasmus Vibe',
}

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ManageJobPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <main className="min-h-screen pt-24 pb-28 px-4 flex items-center justify-center">
        <div className="text-center">
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</p>
          <p className="text-white font-bold text-xl mb-2">No management token</p>
          <p className="text-white/50 text-sm mb-6">Check your listing management email for the link.</p>
          <Link href="/jobs" className="text-brand-primary text-sm">Browse Jobs</Link>
        </div>
      </main>
    )
  }

  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('*')
    .eq('management_token', token)
    .single()

  if (!job) {
    return (
      <main className="min-h-screen pt-24 pb-28 px-4 flex items-center justify-center">
        <div className="text-center">
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>❌</p>
          <p className="text-white font-bold text-xl mb-2">Invalid or expired link</p>
          <p className="text-white/50 text-sm mb-6">
            This management link is invalid. Check your email for the correct link or contact support.
          </p>
          <Link href="/jobs" className="text-brand-primary text-sm">Browse Jobs</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Manage Your Listing</h1>
          <p className="text-white/50 text-sm">
            Only you have access to this page. Keep the link private.
          </p>
        </div>
        <ManageJobClient job={job} token={token} />
      </div>
    </main>
  )
}
