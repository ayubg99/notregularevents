import type { Metadata } from 'next'
import { Anton, JetBrains_Mono } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-jetbrains',
  display:  'swap',
})

const anton = Anton({
  subsets:  ['latin'],
  weight:   '400',
  variable: '--font-anton',
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://notregularevents.com'),
  title: {
    default:  'Not Regular Events — Madrid',
    template: '%s | Not Regular Events',
  },
  description:
    'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid. Join the community.',
  keywords: [
    'Not Regular Events Madrid', 'nightlife Madrid', 'club nights Madrid',
    'guestlist Madrid', 'student parties Madrid',
    'events Madrid students', 'Madrid nightlife community',
    'party Madrid', 'international students Madrid',
  ],
  authors:  [{ name: 'Not Regular Events' }],
  icons: {
    icon:     '/nre-logo.jpeg',
    shortcut: '/nre-logo.jpeg',
    apple:    '/nre-logo.jpeg',
  },
  openGraph: {
    type:        'website',
    locale:      'en_US',
    siteName:    'Not Regular Events',
    title:       'Not Regular Events — Madrid',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid. Join the community.',
    images:      [{ url: '/nre-logo.jpeg' }],
  },
  twitter: {
    card:        'summary',
    title:       'Not Regular Events — Madrid',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife in Madrid.',
    images:      ['/nre-logo.jpeg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full scroll-smooth dark ${jetbrainsMono.variable} ${anton.variable}`}
    >
      <body className="min-h-full flex flex-col font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
