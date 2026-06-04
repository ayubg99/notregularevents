'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EmployerAccountRow, EmployerStatus } from '@/types/database'

const PLAN_COLORS: Record<string, string> = {
  free:         'text-white/50 bg-white/5',
  featured:     'text-orange-400 bg-orange-400/10',
  subscription: 'text-green-400 bg-green-400/10',
}

const STATUS_COLORS: Record<EmployerStatus, string> = {
  active:    'text-green-400 bg-green-400/10 border border-green-400/20',
  suspended: 'text-red-400 bg-red-400/10 border border-red-400/20',
  cancelled: 'text-white/30 bg-white/5 border border-white/10',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

interface Props { employers: EmployerAccountRow[] }

export default function EmployersAdminClient({ employers }: Props) {
  const router  = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const filtered = filter === 'all' ? employers : employers.filter(e => e.status === filter)

  async function updateStatus(id: string, status: EmployerStatus) {
    await fetch(`/api/admin/employers/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'suspended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-orange-500/20 text-orange-400 border border-orange-400/25'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {f}
            <span className="ml-1.5 text-xs opacity-60">
              ({f === 'all' ? employers.length : employers.filter(e => e.status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Company', 'Contact', 'Email', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-white/40 font-medium px-4 py-3 text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-white/30 py-12 text-sm">No employers found</td>
              </tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-[160px] truncate">{emp.company_name}</td>
                  <td className="px-4 py-3 text-white/70 whitespace-nowrap">{emp.contact_name}</td>
                  <td className="px-4 py-3 text-white/50 text-xs max-w-[180px] truncate">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${PLAN_COLORS[emp.plan] ?? ''}`}>
                      {emp.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[emp.status]}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{formatDate(emp.created_at)}</td>
                  <td className="px-4 py-3">
                    {emp.status === 'active' ? (
                      <button
                        onClick={() => updateStatus(emp.id, 'suspended')}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(emp.id, 'active')}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
