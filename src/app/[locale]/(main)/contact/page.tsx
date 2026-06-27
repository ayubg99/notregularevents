import { Mail, MessageCircle, ExternalLink } from 'lucide-react'
import ContactForm from './ContactForm'

export const metadata = {
  title:       'Contact — Not Regular Events',
  description: "Get in touch with the Not Regular Events team. We&apos;re always happy to hear from you.",
  openGraph: {
    title:       'Contact — Not Regular Events Valencia',
    description: "Get in touch with the Not Regular Events team.",
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Contact — Not Regular Events',
    description: "Get in touch with the Not Regular Events team.",
  },
}

const CONTACT_LINKS = [
  {
    icon:  <MessageCircle size={20} />,
    label: 'WhatsApp',
    value: '+34 672 587 453',
    href:  'https://wa.me/34672587453',
    color: 'text-green-400',
    bg:    'bg-green-500/10 border-green-500/20',
  },
  {
    icon:  <Mail size={20} />,
    label: 'Email',
    value: 'notregularevents@gmail.com',
    href:  'mailto:notregularevents@gmail.com',
    color: 'text-brand-primary',
    bg:    'bg-brand-primary/10 border-brand-primary/20',
  },
  {
    icon:  <ExternalLink size={20} />,
    label: 'Instagram',
    value: '@notregularevents',
    href:  'https://instagram.com/notregularevents',
    color: 'text-pink-400',
    bg:    'bg-pink-500/10 border-pink-500/20',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
        <div className="relative max-w-xl mx-auto">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Contact
          </span>
          <h1 className="font-heading text-5xl font-bold text-white mb-4">Get In Touch</h1>
          <p className="text-white/50 text-base">
            Got a question, idea, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left — form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          {/* Right — contact info + map */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Contact links */}
            {CONTACT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card rounded-2xl p-5 flex items-center gap-4 border transition-all duration-200 hover:brightness-110 ${link.bg}`}
              >
                <span className={link.color}>{link.icon}</span>
                <div>
                  <p className="text-white/40 text-xs mb-0.5">{link.label}</p>
                  <p className="text-white font-medium text-sm">{link.value}</p>
                </div>
              </a>
            ))}

            {/* Google Maps embed */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49971.42!2d-0.4055!3d39.4699!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd604f4cf0effffff%3A0xb1ff254e2b6b510!2sValencia%2C+Spain!5e0!3m2!1sen!2ses!4v1700000000000"
                className="w-full h-52 border-0 grayscale opacity-60"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Valencia, Spain"
              />
            </div>

            <p className="text-white/30 text-xs text-center">
              Based in Madrid, Spain 🇪🇸 · Typically reply within 24h
            </p>

          </div>
        </div>
      </section>

    </div>
  )
}
