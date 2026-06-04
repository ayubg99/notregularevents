'use client'

import DataTable from '@/components/admin/DataTable'
import UserRoleSelect from './UserRoleSelect'
import { getNationalityLabel } from '@/lib/constants/nationalities'

export type MemberRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  nationality: string | null
  university: string | null
  membership_plan: string | null
  membership_status: string | null
  last_sign_in: string | null
} & Record<string, unknown>

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-red-500/15 text-red-400',
  ambassador: 'bg-purple-500/15 text-purple-400',
  student:    'bg-blue-500/15 text-blue-400',
}

export default function MembersClient({ rows }: { rows: MemberRow[] }) {
  const columns = [
    { key: 'full_name', header: 'Name', sortable: true,
      render: (row: MemberRow) => row.full_name ?? <span className="text-white/30">—</span> },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role',
      render: (row: MemberRow) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[row.role] ?? ''}`}>
          {row.role}
        </span>
      )},
    { key: 'nationality', header: 'Nationality',
      render: (row: MemberRow) => row.nationality ? getNationalityLabel(row.nationality) : '—' },
    { key: 'university', header: 'University',
      render: (row: MemberRow) => row.university ?? '—' },
    { key: 'membership_status', header: 'Membership',
      render: (row: MemberRow) => row.membership_status === 'active'
        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 capitalize">{row.membership_plan}</span>
        : <span className="text-white/30 text-xs">—</span> },
    { key: 'created_at', header: 'Joined', sortable: true,
      render: (row: MemberRow) => new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'last_sign_in', header: 'Last Active',
      render: (row: MemberRow) => row.last_sign_in
        ? new Date(row.last_sign_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : <span className="text-white/30">—</span> },
  ]

  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={['full_name', 'email', 'role'] as (keyof MemberRow)[]}
      actions={(row) => <UserRoleSelect userId={row.id} currentRole={row.role} />}
    />
  )
}
