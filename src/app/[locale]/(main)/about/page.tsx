export const metadata = {
  title:       'About — Not Regular Events',
  description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid.',
  openGraph: {
    title:       'About — Not Regular Events',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About — Not Regular Events',
    description: 'Not Regular Events — the best nightlife community in Madrid.',
  },
}

const TEAM = [
  { name: 'Leadership',     role: 'Co-Founders & Strategy', nationality: '🇪🇸', emoji: '🌟' },
  { name: 'Events Team',    role: 'Events & Nightlife',     nationality: '🎉', emoji: '🎉' },
  { name: 'Trips Team',     role: 'Travel & Adventures',    nationality: '🌍', emoji: '✈️' },
  { name: 'Community Team', role: 'Community & Growth',     nationality: '💬', emoji: '💬' },
]

const PHOTO_GRADIENTS = [
  'from-brand-primary/40 to-brand-accent/20',
  'from-purple-500/30 to-brand-primary/20',
  'from-brand-accent/30 to-emerald-500/20',
  'from-emerald-500/20 to-brand-primary/30',
  'from-orange-500/20 to-brand-accent/30',
  'from-brand-primary/20 to-purple-500/30',
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-accent/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center mb-12">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Our Story
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            About Not Regular Events
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Not your regular events. Born in Madrid, built for the community.
          </p>
        </div>

        {/* Team photo placeholder */}
        <div className="relative max-w-4xl mx-auto rounded-2xl aspect-video bg-gradient-to-br from-brand-primary/30 via-brand-primary/10 to-brand-accent/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, var(--color-brand-primary) 0%, transparent 60%), radial-gradient(circle at 70% 40%, var(--color-brand-accent) 0%, transparent 50%)' }}
          />
          <p className="relative text-white/40 text-sm font-medium">Team photo coming soon</p>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="flex flex-col gap-6 text-white/65 text-base leading-relaxed">
          <p>
            Not Regular Events was born from our own experience as students in Madrid. We know what it means
            to arrive in a new city, want to meet people and enjoy it without overspending.
          </p>
          <p>
            That&apos;s why we create accessible, authentic events designed to connect people. More than parties,
            we create experiences and new friendships — from Latin nights to reggaeton, urban and electronic,
            through music and shared experience.
          </p>
          <p>
            We create a community of students and night owls who understand that leisure isn&apos;t consumption,
            it&apos;s connection. With guestlists, invitations and accessible events, we bring cultures and styles
            together in Madrid.
          </p>
        </div>
      </section>

      {/* ── Mission statement ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <blockquote className="border-l-4 border-brand-primary pl-6">
          <p className="font-heading text-2xl sm:text-3xl font-bold italic text-white leading-snug">
            &ldquo;We&apos;re looking to create a space where you feel at home, meet new people and experience Madrid as a community.&rdquo;
          </p>
        </blockquote>
      </section>

      {/* ── Team grid ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">The Team</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM.map((member) => (
            <div key={member.name} className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 flex items-center justify-center text-3xl">
                {member.emoji}
              </div>
              <div>
                <p className="font-heading font-bold text-white text-sm">{member.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{member.role}</p>
                <p className="text-lg mt-1">{member.nationality}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Community photo grid ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">Our Community</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PHOTO_GRADIENTS.map((gradient, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-white/20 text-xs font-medium">Photo {i + 1}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
