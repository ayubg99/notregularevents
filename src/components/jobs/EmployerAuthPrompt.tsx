import Link from 'next/link'

export default function EmployerAuthPrompt() {
  return (
    <main className="min-h-screen pt-24 pb-28 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>💼</p>
        <h1 className="font-heading text-3xl font-bold text-white mb-3">
          Post jobs on Erasmus Life
        </h1>
        <p className="text-white/50 text-base mb-8 leading-relaxed">
          Create a free employer account to post jobs and reach international students in Valencia.
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link
            href="/employer/register"
            className="block w-full py-4 rounded-2xl bg-brand-primary hover:brightness-110 text-white font-bold text-base transition-all text-center"
          >
            Create Employer Account →
          </Link>
          <Link
            href="/employer/login"
            style={{
              display:        'block',
              padding:        '14px',
              borderRadius:   '16px',
              background:     'rgba(255,255,255,0.05)',
              border:         '1px solid rgba(255,255,255,0.1)',
              color:          '#fff',
              textDecoration: 'none',
              fontWeight:     600,
              fontSize:       '15px',
            }}
          >
            Login to existing account
          </Link>
        </div>

        <p className="text-white/30 text-sm mt-8">
          Looking for a job?{' '}
          <Link href="/jobs" className="text-brand-primary hover:brightness-110 transition-colors">
            Browse listings →
          </Link>
        </p>
      </div>
    </main>
  )
}
