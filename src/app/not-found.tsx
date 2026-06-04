import Link from'next/link'
import { NextIntlClientProvider } from'next-intl'
import { getMessages } from'next-intl/server'
import Navbar from'@/components/layout/Navbar'
import Footer from'@/components/layout/Footer'

export default async function NotFound() {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-lg">
          <p className="font-heading text-8xl md:text-[10rem] font-bold text-gradient leading-none mb-4">
            404
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3">
            Page not found
          </h1>
          <p className="text-white/50 text-base mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold transition-all shadow-brand-sm hover:shadow-brand-md hover:-translate-y-px"
          >
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </NextIntlClientProvider>
  )
}
