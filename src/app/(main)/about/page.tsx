export const metadata = {
  title:       'About — Erasmus Vibe',
  description: 'Founded for internationals in Valencia. We bring together expats, students, digital nomads and young professionals into one community.',
  openGraph: {
    title:       'About — Erasmus Vibe Valencia',
    description: 'Founded for internationals in Valencia. We bring together expats, students, digital nomads and young professionals into one community.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About — Erasmus Vibe',
    description: 'Founded for internationals in Valencia — expats, students, digital nomads and young professionals.',
  },
}

const TEAM = [
  { name: 'Alex M.',  role: 'Co-Founder & CEO',   nationality: '🇩🇪', emoji: '👨‍💼' },
  { name: 'Sofia R.', role: 'Head of Events',      nationality: '🇪🇸', emoji: '🎉' },
  { name: 'Luca B.',  role: 'Trips & Experiences', nationality: '🇮🇹', emoji: '✈️' },
  { name: 'Mia K.',   role: 'Community & Growth',  nationality: '🇫🇷', emoji: '💬' },
]

const PHOTO_GRADIENTS = [
  'from-brand-primary/40 to-brand-accent/20',
  'from-purple-500/30 to-brand-primary/20',
  'from-brand-accent/30 to-emerald-500/20',
  'from-emerald-500/20 to-brand-primary/30',
  'from-amber-500/20 to-brand-accent/30',
  'from-brand-primary/20 to-purple-500/30',
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/15 via-brand-dark to-brand-accent/10 pointer-events-none" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-24 w-64 h-64 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center mb-12">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Our Story
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            We Are Erasmus Vibe
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Born in Valencia, built for every international who calls this city home.
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
            It started in September 2023 when two Erasmus students — Alex from Berlin and Sofia from Madrid — landed
            in Valencia with two suitcases and zero plans. They found a city bursting with energy but no real hub
            for internationals to connect. WhatsApp groups, scattered Facebook posts, and missed opportunities
            were the norm.
          </p>
          <p>
            So they built one. Erasmus Vibe started as a simple events newsletter and quickly became the go-to
            platform for internationals in Valencia. With Luca joining to lead trips and Mia building the community
            side, the team organised over 50 events in the first semester alone — beach parties, hiking trips,
            city tours, and paella nights that turned strangers into lifelong friends.
          </p>
          <p>
            Today, Erasmus Vibe is home to 500+ members from 50+ nationalities — Erasmus students, expats,
            digital nomads, au pairs, and young professionals who all chose Valencia and want to make every
            single day count. We&apos;ve grown beyond one audience because Valencia&apos;s international
            community is bigger than any one label. That&apos;s the mission. That&apos;s the vibe.
          </p>
        </div>
      </section>

      {/* ── Mission statement ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <blockquote className="border-l-4 border-brand-primary pl-6">
          <p className="font-heading text-2xl sm:text-3xl font-bold italic text-white leading-snug">
            &ldquo;To make Valencia feel like home for every international — one experience at a time.&rdquo;
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
