import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { MessageCircle, Briefcase, Home, Languages, Mail } from 'lucide-react'
import FeaturedEvents from '@/components/home/FeaturedEvents'

export const metadata: Metadata = {
  title:       'Community | Erasmus Vibe Valencia',
  description: 'Join the Erasmus Vibe international community in Valencia. Find flatmates, language exchange partners, job leads and events.',
  openGraph: {
    title:       'Community | Erasmus Vibe Valencia',
    description: 'Find flatmates, language exchange partners, job leads and events for internationals in Valencia.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Community | Erasmus Vibe Valencia',
    description: 'Find flatmates, language exchange partners, job leads and events for internationals in Valencia.',
  },
}

// ─── WhatsApp groups data ───────────────────────────────────────

const WHATSAPP_GROUPS = [
  { emoji: '🎉', label: 'Party & Nightlife',    desc: 'Events, club nights and after-parties'       },
  { emoji: '🏖️', label: 'Beach & Outdoors',     desc: 'Beach days, hiking and outdoor adventures'   },
  { emoji: '💼', label: 'Professional Network', desc: 'Jobs, networking and career opportunities'    },
  { emoji: '🗣️', label: 'Language Exchange',    desc: 'Practice Spanish, English, French and more'  },
  { emoji: '🍷', label: 'Food & Wine',           desc: 'Restaurant tips, wine tours and food events' },
  { emoji: '🏠', label: 'Housing & Flatmates',  desc: 'Find rooms, flatmates and housing tips'      },
]

// ─── Skeleton for events Suspense fallback ──────────────────────

function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden glass-card">
          <div className="h-48 bg-white/5 animate-pulse" />
          <div className="p-5 flex flex-col gap-3">
            <div className="h-5 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Coming soon card ───────────────────────────────────────────

function ComingSoonCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
        <Icon size={24} className="text-brand-primary" />
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </div>
      <span className="px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-semibold uppercase tracking-wide">
        Coming Soon
      </span>
      <a
        href="mailto:info@erasmusvibe.com"
        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors duration-200"
      >
        <Mail size={12} />
        Get notified
      </a>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(78,205,196,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Community
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            Your Community<br />
            <span className="text-gradient">in Valencia</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Connect with expats, students, digital nomads and young professionals.
            Find flatmates, exchange languages, and discover your crowd.
          </p>
        </div>
      </section>

      {/* ── Upcoming Events ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-8">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
            What&apos;s On
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Upcoming Events
          </h2>
        </div>
        <Suspense fallback={<EventsSkeleton />}>
          <FeaturedEvents />
        </Suspense>
        <div className="mt-8 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary hover:brightness-110 text-white font-semibold text-sm transition-all duration-200 shadow-brand-sm hover:shadow-brand-md hover:-translate-y-px"
          >
            View all events
          </Link>
        </div>
      </section>

      {/* ── WhatsApp Groups ── */}
      <section className="bg-gradient-dark py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-accent text-sm font-semibold uppercase tracking-widest mb-2">
              Stay Connected
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              WhatsApp Groups by Interest
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Join the group that fits you. All groups are moderated and Valencia-based.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHATSAPP_GROUPS.map(({ emoji, label, desc }) => (
              <a
                key={label}
                href="https://chat.whatsapp.com/your-group-link"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-2xl p-5 flex items-start gap-4 hover:shadow-glow-teal transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <span className="text-3xl flex-shrink-0 mt-0.5">{emoji}</span>
                <div>
                  <p className="font-heading font-bold text-white text-sm group-hover:text-brand-accent transition-colors duration-200">
                    {label}
                  </p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
                <MessageCircle size={16} className="ml-auto flex-shrink-0 text-green-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Boards (Coming Soon) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
            Community Boards
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            More Ways to Connect
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            We&apos;re building tools specifically for Valencia&apos;s international community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComingSoonCard
            icon={Languages}
            title="Language Exchange"
            desc="Find a language partner — practice Spanish, English, French, German, Italian and more with locals and internationals."
          />
          <ComingSoonCard
            icon={Home}
            title="Housing & Flatmates"
            desc="Find rooms, post your spare room, or find flatmates who match your vibe. Valencia-only listings."
          />
          <ComingSoonCard
            icon={Briefcase}
            title="Job Board"
            desc="Job listings, freelance gigs and internships for internationals in Valencia. English-friendly employers."
          />
        </div>
      </section>

    </div>
  )
}
