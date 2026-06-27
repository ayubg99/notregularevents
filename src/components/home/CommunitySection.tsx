import { useTranslations } from 'next-intl'
import { MessageCircle, Users, Zap } from 'lucide-react'

export default function CommunitySection() {
  const t = useTranslations('community')

  return (
    <section className="py-24 bg-gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-4">
          {t('label')}
        </p>

        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
          {t('titleLine1')}
          <br />
          <span className="text-brand-primary">{t('titleLine2')}</span>
        </h2>

        <p className="text-white/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
          {t('description')}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Users,         labelKey: 'nationalities' as const },
            { icon: Zap,           labelKey: 'weeklyEvents'  as const },
            { icon: MessageCircle, labelKey: 'activeChats'   as const },
          ].map(({ icon: Icon, labelKey }) => (
            <span key={labelKey} className="flex items-center gap-2 px-4 py-2 glass rounded-full text-white/70 text-sm">
              <Icon size={14} className="text-brand-primary flex-shrink-0" />
              {t(labelKey)}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://chat.whatsapp.com/your-group-link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-full hover:-translate-y-px transition-all duration-200 w-full sm:w-auto"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={20} />
            {t('studentCommunityBtn')}
          </a>
          <a
            href="https://chat.whatsapp.com/your-party-group-link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-4 glass border border-white/20 hover:bg-white/10 text-white font-semibold rounded-full transition-all duration-200 w-full sm:w-auto"
          >
            <MessageCircle size={20} />
            {t('partyGroupBtn')}
          </a>
        </div>

      </div>
    </section>
  )
}
