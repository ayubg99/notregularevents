import type { Metadata } from 'next'
import { MessageCircle, Briefcase, Home, Languages } from 'lucide-react'

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

// ─── WhatsApp groups data ───────────────────────────────────────

const WHATSAPP_GROUPS = [
  { emoji: '🎉', label: 'Party & Nightlife',    desc: 'Events, club nights and after-parties'       },
  { emoji: '🏖️', label: 'Beach & Outdoors',     desc: 'Beach days, hiking and outdoor adventures'   },
  { emoji: '💼', label: 'Professional Network', desc: 'Jobs, networking and career opportunities'    },
  { emoji: '🗣️', label: 'Language Exchange',    desc: 'Practice Spanish, English, French and more'  },
  { emoji: '🍷', label: 'Food & Wine',           desc: 'Restaurant tips, wine tours and food events' },
  { emoji: '🏠', label: 'Housing & Flatmates',  desc: 'Find rooms, flatmates and housing tips'      },
]

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
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(232,168,124,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-accent text-sm font-semibold uppercase tracking-widest mb-2">
              Stay Connected
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              WhatsApp Groups by Interest
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Join the group that fits you. All groups are moderated and Madrid-based.
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
            We&apos;re building more tools specifically for the Madrid community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComingSoonCard
            icon={Languages}
            title="Language Exchange"
            desc="Find a language partner — practice Spanish, English, French, German, Italian and more with locals and international students."
          />
          <ComingSoonCard
            icon={Home}
            title="Housing & Flatmates"
            desc="Find rooms, post your spare room, or find flatmates who match your vibe. Madrid-only listings."
          />
          <ComingSoonCard
            icon={Briefcase}
            title="Job Board"
            desc="Job listings, internships and part-time opportunities for students in Madrid. English-friendly employers."
          />
        </div>
      </section>

    </div>
  )
}
