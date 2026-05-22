import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  )
}
