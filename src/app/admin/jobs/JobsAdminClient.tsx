'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { JobListingRow, JobStatus } from '@/types/database'

const STATUS_COLORS: Record<JobStatus, string> = {
  active: 'text-green-400 bg-green-400/10 border border-green-400/20',
  draft:  'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  closed: 'text-red-400 bg-red-400/10 border border-red-400/20',
}

const TYPE_LABELS: Record<string, string> = {
  part_time:   'Part-time',
  internship:  'Internship',
  full_time:   'Full-time',
  freelance:   'Freelance',
  volunteer:   'Volunteer',
}

type StatusFilter = JobStatus | 'all'

const TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All',    value: 'all'    },
  { label: 'Active', value: 'active' },
  { label: 'Draft',  value: 'draft'  },
  { label: 'Closed', value: 'closed' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

interface Props { jobs: JobListingRow[] }

export default function JobsAdminClient({ jobs }: Props) {
  const router  = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter,  setFilter]  = useState<StatusFilter>('all')
  const [confirm, setConfirm] = useState<string | null>(null)

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/jobs/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    startTransition(() => { router.refresh() })
  }

  async function deleteJob(id: string) {
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    setConfirm(null)
    startTransition(() => { router.refresh() })
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.value
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/25'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">
              ({tab.value === 'all' ? jobs.length : jobs.filter(j => j.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Title', 'Company', 'Type', 'Category', 'Featured', 'Urgent', 'Status', 'Views', 'Posted', 'Expires', 'Actions'].map(h => (
                <th key={h} className="text-left text-white/40 font-medium px-4 py-3 text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-white/30 py-12 text-sm">
                  No jobs found
                </td>
              </tr>
            ) : (
              filtered.map(job => (
                <tr key={job.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-amber-400 transition-colors max-w-[180px] block truncate">
                      {job.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-white/70 max-w-[120px] truncate">{job.company_name}</td>
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">{TYPE_LABELS[job.job_type] ?? job.job_type}</td>
                  <td className="px-4 py-3 text-white/60 capitalize">{job.category}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patch(job.id, { is_featured: !job.is_featured })}
                      disabled={isPending}
                      className={`text-xs px-2 py-1 rounded-md font-medium transition-all ${job.is_featured ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                      title="Toggle featured"
                    >
                      {job.is_featured ? '⭐ Yes' : '—'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patch(job.id, { is_urgent: !job.is_urgent })}
                      disabled={isPending}
                      className={`text-xs px-2 py-1 rounded-md font-medium transition-all ${job.is_urgent ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                      title="Toggle urgent"
                    >
                      {job.is_urgent ? '🔥 Yes' : '—'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{job.views}</td>
                  <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{formatDate(job.created_at)}</td>
                  <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{formatDate(job.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {job.status !== 'active' && (
                        <button
                          onClick={() => patch(job.id, { status: 'active' })}
                          disabled={isPending}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium"
                        >
                          Activate
                        </button>
                      )}
                      {job.status === 'active' && (
                        <button
                          onClick={() => patch(job.id, { status: 'closed' })}
                          disabled={isPending}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-colors font-medium"
                        >
                          Close
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm(job.id)}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-2">Delete Job Listing?</h3>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(confirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
