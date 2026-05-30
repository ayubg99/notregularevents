import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import EmployerDashboardClient from './EmployerDashboardClient'
import type { EmployerAccountRow, JobListingRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Employer Dashboard — Erasmus Vibe Jobs' }

interface Props {
  searchParams: Promise<{ upgraded?: string }>
}

export default async function EmployerDashboardPage({ searchParams }: Props) {
  const { upgraded } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/employer/login?redirectTo=/employer/dashboard')

  const admin = getAdminClient()

  const [{ data: employerRaw }, { data: jobsRaw }] = await Promise.all([
    admin.from('employer_accounts').select('*').eq('user_id', user.id).single(),
    admin.from('job_listings').select('*').eq('posted_by_user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!employerRaw) redirect('/employer/register')

  const employer = employerRaw as EmployerAccountRow
  const jobs     = (jobsRaw ?? []) as JobListingRow[]

  return (
    <EmployerDashboardClient employer={employer} jobs={jobs} upgraded={upgraded === 'true'} />
  )
}
