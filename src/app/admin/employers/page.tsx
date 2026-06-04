import { getAdminClient } from'@/lib/supabase/admin'
import EmployersAdminClient from'./EmployersAdminClient'
import type { EmployerAccountRow } from'@/types/database'

export default async function AdminEmployersPage() {
  const admin = getAdminClient()
  const { data: employers } = await admin
    .from('employer_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Employer Accounts</h1>
      <EmployersAdminClient employers={(employers ?? []) as EmployerAccountRow[]} />
    </div>
  )
}
