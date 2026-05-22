import { getAdminClient } from '@/lib/supabase/admin'
import DataTable from '@/components/admin/DataTable'
import UserRoleSelect from './UserRoleSelect'
import type { UserRow } from '@/types/database'

type UserWithProfile = UserRow & {
  profiles: { nationality: string | null; university: string | null } | null
} & Record<string, unknown>

export default async function AdminUsersPage() {
  const admin = getAdminClient()
  const { data: users } = await admin
    .from('users')
    .select('*, profiles(nationality, university)')
    .order('created_at', { ascending: false })

  const rows = (users ?? []) as unknown as UserWithProfile[]

  const ROLE_COLORS: Record<string, string> = {
    admin:      'bg-red-500/15 text-red-400',
    ambassador: 'bg-purple-500/15 text-purple-400',
    student:    'bg-blue-500/15 text-blue-400',
  }

  const columns = [
    { key: 'full_name', header: 'Name', sortable: true,
      render: (row: UserWithProfile) => row.full_name ?? <span className="text-white/30">—</span> },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role',
      render: (row: UserWithProfile) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[row.role] ?? ''}`}>
          {row.role}
        </span>
      )},
    { key: 'nationality', header: 'Nationality',
      render: (row: UserWithProfile) => row.profiles?.nationality ?? '—' },
    { key: 'university', header: 'University',
      render: (row: UserWithProfile) => row.profiles?.university ?? '—' },
    { key: 'created_at', header: 'Joined', sortable: true,
      render: (row: UserWithProfile) => new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
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
        data={rows}
        columns={columns}
        searchKeys={['full_name', 'email', 'role'] as (keyof UserWithProfile)[]}
        actions={(row) => <UserRoleSelect userId={row.id as string} currentRole={row.role as string} />}
      />
    </>
  )
}
