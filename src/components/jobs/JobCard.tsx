import type { JobListingRow } from '@/types/database'

interface Props {
  job: JobListingRow
}

export default function JobCard({ job }: Props) {
  return (
    <a
      href={`/jobs/${job.id}`}
      style={{
        display: 'block',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Company logo */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {job.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '18px' }}>
              {job.company_name.charAt(0)}
            </span>
          )}
        </div>

        {/* Job info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            {/* Job type badge */}
            <span
              style={{
                background:
                  job.job_type === 'internship'
                    ? 'rgba(78,205,196,0.15)'
                    : job.job_type === 'part_time'
                      ? 'rgba(245,166,35,0.15)'
                      : 'rgba(255,107,53,0.15)',
                color:
                  job.job_type === 'internship'
                    ? '#4ECDC4'
                    : job.job_type === 'part_time'
                      ? '#F5A623'
                      : '#FF6B35',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {job.job_type.replace(/_/g, ' ')}
            </span>

            {job.is_urgent && (
              <span
                style={{
                  background: 'rgba(255,68,68,0.15)',
                  color: '#FF4444',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                🔥 Urgent
              </span>
            )}

            {job.is_featured && (
              <span
                style={{
                  background: 'rgba(245,166,35,0.15)',
                  color: '#F5A623',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ⭐ Featured
              </span>
            )}
          </div>

          <p
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              margin: '0 0 4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {job.title}
          </p>

          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 10px' }}>
            {job.company_name}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {job.location}
            </span>
            {job.hours_per_week && (
              <span style={{ color: '#888', fontSize: '13px' }}>
                🕐 {job.hours_per_week}h/week
              </span>
            )}
            {job.salary_text && (
              <span style={{ color: '#2ECC71', fontSize: '13px', fontWeight: 600 }}>
                💶 {job.salary_text}
              </span>
            )}
            <span style={{ color: '#888', fontSize: '13px' }}>
              🗣️{' '}
              {job.language_required === 'both'
                ? 'EN + ES'
                : job.language_required === 'english'
                  ? 'English'
                  : job.language_required === 'spanish'
                    ? 'Spanish'
                    : 'Any language'}
            </span>
          </div>
        </div>

        <span style={{ color: '#888', fontSize: '20px', flexShrink: 0 }}>→</span>
      </div>
    </a>
  )
}
