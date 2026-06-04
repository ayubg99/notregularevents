import { MessageCircle, Camera, Users, Zap } from 'lucide-react'

const FEATURE_PILLS = [
  { icon: Users,         label: '50+ Nationalities'    },
  { icon: Zap,           label: 'Weekly Events'         },
  { icon: MessageCircle, label: 'Active Group Chats'    },
]

export default function CommunitySection() {
  return (
    <section className="py-24 bg-gradient-dark relative overflow-hidden">

      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Eyebrow */}
        <p className="text-brand-accent text-sm font-semibold uppercase tracking-widest mb-4">
          Join the Community
        </p>

        {/* Headline */}
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          500+ Internationals.
          <br />
          <span className="text-gradient">One Vibe.</span>
        </h2>

        <p className="text-white/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
          Join Valencia&apos;s fastest-growing international community.
          Expats, students, nomads, and professionals — connect, explore, and belong.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {FEATURE_PILLS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-white/70 text-sm"
            >
              <Icon size={14} className="text-brand-accent flex-shrink-0" />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://chat.whatsapp.com/your-group-link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-full hover:-translate-y-px transition-all duration-200 w-full sm:w-auto"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={20} />
            Join WhatsApp Group
          </a>
          <a
            href="https://instagram.com/erasmuslifevalencia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-4 glass border border-white/20 hover:bg-white/10 text-white font-semibold rounded-full transition-all duration-200 w-full sm:w-auto"
          >
            <Camera size={20} />
            Follow on Instagram
          </a>
        </div>

      </div>
    </section>
  )
}
