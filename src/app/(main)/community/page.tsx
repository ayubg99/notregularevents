import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Community | Not Regular Events Madrid',
  description: 'Join the Not Regular Events community in Madrid. Connect with students and night owls, find flatmates, join WhatsApp groups and discover events.',
  openGraph: {
    title:       'Community | Not Regular Events Madrid',
    description: 'Connect with the Not Regular Events community in Madrid. WhatsApp groups, flatmate finder and weekly events.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Community | Not Regular Events Madrid',
    description: 'Connect with Not Regular Events community in Madrid. Events, WhatsApp groups, parties and more.',
  },
}

const GROUPS = [
  {
    icon:        '💬',
    title:       'Student Community',
    description: 'Connect with other students, make new friends and find your people in Madrid.',
    link:        '[STUDENT_COMMUNITY_WHATSAPP_LINK]',
  },
  {
    icon:        '🎉',
    title:       'Party Group',
    description: 'Get notified about events, drops and exclusive guestlist access first.',
    link:        '[PARTY_GROUP_WHATSAPP_LINK]',
  },
  {
    icon:        '🏠',
    title:       'Housing Group',
    description: "Haven't found a room yet? Share listings and find flatmates to search together.",
    link:        '[HOUSING_WHATSAPP_LINK]',
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(232,168,124,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-[var(--accent-blue)] text-xs font-bold tracking-widest uppercase mb-4">
            Community
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            The Not Regular Events<br />
            <span className="text-gradient">Community</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Students and night owls. Weekly events. Lifelong friendships.
            This is the Not Regular Events community in Madrid.
          </p>
        </div>
      </section>

      {/* ── WhatsApp Groups ── */}
      <section className="bg-gradient-dark py-20 px-4">
        <div className="container-marketing">
          <div className="text-center mb-10">
            <p className="font-mono text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent-blue)' }}>
              Stay Connected
            </p>
            <h2 className="section-title-distorted text-white text-center mb-3" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
              Join Our WhatsApp Groups
            </h2>
            <p className="font-mono text-sm mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
              All groups are moderated and Madrid-based.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GROUPS.map((group) => (
              <a
                key={group.title}
                href={group.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md p-6 no-underline transition-colors duration-200 border hover:border-[var(--accent-blue)]"
                style={{
                  background:   'var(--bg-card)',
                  borderColor:  'var(--border-subtle)',
                }}
              >
                <span className="text-[28px]">{group.icon}</span>
                <h3 className="font-mono font-bold text-white mt-3 mb-2" style={{ fontSize: '16px' }}>
                  {group.title}
                </h3>
                <p className="font-mono leading-relaxed mb-4" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {group.description}
                </p>
                <span className="font-mono font-bold uppercase" style={{ color: 'var(--accent-blue)', fontSize: '12px' }}>
                  Join Group →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
