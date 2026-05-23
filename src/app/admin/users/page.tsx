export const dynamic = 'force-dynamic'

import { getAdminClient } from '@/lib/supabase/admin'
import DataTable from '@/components/admin/DataTable'
import UserRoleSelect from './UserRoleSelect'

export default async function AdminUsersPage() {
  const admin = getAdminClient()

  const [
    { data: users, error: usersError },
    { data: profiles },
    { data: memberships },
  ] = await Promise.all([
    admin.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }),
    admin.from('profiles').select('user_id, nationality, university'),
    admin.from('memberships').select('user_id, plan, status'),
  ])

  let authUsers: { id: string; last_sign_in_at?: string }[] = []
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    authUsers = data?.users ?? []
  } catch {
    // Non-fatal: last active column will show —
  }

  if (usersError) {
    return <div className="p-10 text-red-400">Error loading members: {usersError.message}</div>
  }

  const rows = (users ?? []).map(u => ({
    ...u,
    nationality:       profiles?.find(p => p.user_id === u.id)?.nationality ?? null,
    university:        profiles?.find(p => p.user_id === u.id)?.university ?? null,
    membership_plan:   memberships?.find(m => m.user_id === u.id)?.plan ?? null,
    membership_status: memberships?.find(m => m.user_id === u.id)?.status ?? null,
    last_sign_in:      authUsers.find(a => a.id === u.id)?.last_sign_in_at ?? null,
  }))

  type MemberRow = typeof rows[number] & Record<string, unknown>

  const ROLE_COLORS: Record<string, string> = {
    admin:      'bg-red-500/15 text-red-400',
    ambassador: 'bg-purple-500/15 text-purple-400',
    student:    'bg-blue-500/15 text-blue-400',
  }

  const columns = [
    { key: 'full_name', header: 'Name', sortable: true,
      render: (row: MemberRow) => row.full_name ?? <span className="text-white/30">—</span> },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role',
      render: (row: MemberRow) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[row.role as string] ?? ''}`}>
          {row.role as string}
        </span>
      )},
    { key: 'nationality', header: 'Nationality',
      render: (row: MemberRow) => (row.nationality as string | null) ?? '—' },
    { key: 'university', header: 'University',
      render: (row: MemberRow) => (row.university as string | null) ?? '—' },
    { key: 'membership_status', header: 'Membership',
      render: (row: MemberRow) => row.membership_status === 'active'
        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 capitalize">{row.membership_plan as string}</span>
        : <span className="text-white/30 text-xs">—</span> },
    { key: 'created_at', header: 'Joined', sortable: true,
      render: (row: MemberRow) => new Date(row.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'last_sign_in', header: 'Last Active',
      render: (row: MemberRow) => row.last_sign_in
        ? new Date(row.last_sign_in as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : <span className="text-white/30">—</span> },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Members</h1>
          <p className="text-white/40 text-sm mt-0.5">{rows.length} registered members</p>
        </div>
      </div>
      <DataTable
        data={rows as MemberRow[]}
        columns={columns}
        searchKeys={['full_name', 'email', 'role'] as (keyof MemberRow)[]}
        actions={(row) => <UserRoleSelect userId={row.id as string} currentRole={row.role as string} />}
      />
    </>
  )
}
