'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import JobCard from './JobCard'
import type { JobListingRow, JobType, JobCategory, JobLanguage } from '@/types/database'

interface Props {
  jobs: JobListingRow[]
}

const JOB_TYPE_TABS: Array<{ label: string; value: JobType | 'all' }> = [
  { label: 'All',        value: 'all'       },
  { label: 'Part-time',  value: 'part_time'  },
  { label: 'Internship', value: 'internship' },
  { label: 'Full-time',  value: 'full_time'  },
  { label: 'Freelance',  value: 'freelance'  },
]

const CATEGORIES: Array<{ label: string; value: JobCategory | 'all' }> = [
  { label: 'All Categories', value: 'all'          },
  { label: 'Hospitality',    value: 'hospitality'  },
  { label: 'Marketing',      value: 'marketing'    },
  { label: 'Tech',           value: 'tech'         },
  { label: 'Education',      value: 'education'    },
  { label: 'Retail',         value: 'retail'       },
  { label: 'Events',         value: 'events'       },
  { label: 'Language',       value: 'language'     },
  { label: 'Other',          value: 'other'        },
]

const LANGUAGES: Array<{ label: string; value: JobLanguage | 'all' }> = [
  { label: 'Any Language', value: 'all'     },
  { label: 'English',      value: 'english' },
  { label: 'Spanish',      value: 'spanish' },
  { label: 'Both',         value: 'both'    },
]

export default function JobsClient({ jobs }: Props) {
  const [search,   setSearch]   = useState('')
  const [jobType,  setJobType]  = useState<JobType | 'all'>('all')
  const [category, setCategory] = useState<JobCategory | 'all'>('all')
  const [language, setLanguage] = useState<JobLanguage | 'all'>('all')

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (jobType  !== 'all' && j.job_type          !== jobType)  return false
      if (category !== 'all' && j.category           !== category) return false
      if (language !== 'all' && j.language_required  !== language) return false
      if (search) {
        const q = search.toLowerCase()
        if (!j.title.toLowerCase().includes(q) && !j.company_name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [jobs, jobType, category, language, search])

  return (
    <div id="jobs-list">
      {/* Filter bar */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            width: '100%',
          }}
        />

        {/* Job type tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {JOB_TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setJobType(tab.value)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: jobType === tab.value ? '1px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
                background: jobType === tab.value ? 'rgba(245,166,35,0.15)' : 'transparent',
                color: jobType === tab.value ? '#F5A623' : '#888',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category + Language row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as JobCategory | 'all')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              flex: 1,
              minWidth: '160px',
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value} style={{ background: '#1A1A2E' }}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={e => setLanguage(e.target.value as JobLanguage | 'all')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              flex: 1,
              minWidth: '160px',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} style={{ background: '#1A1A2E' }}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Count */}
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
        {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888',
          }}
        >
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
            No jobs found
          </p>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>
            Try adjusting your filters or{' '}
            <Link href="/jobs/post" style={{ color: '#F5A623' }}>
              post a job
            </Link>
          </p>
        </div>
      ) : (
        filtered.map(job => <JobCard key={job.id} job={job} />)
      )}
    </div>
  )
}
