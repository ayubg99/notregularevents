import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmuslifevalencia.com'),
  title: {
    default:  'Erasmus Life Valencia',
    template: '%s | Erasmus Life Valencia',
  },
  description:
    'The official platform for Erasmus students in Valencia. Book events, trips, find housing and join the community. Since 1994.',
  keywords: [
    'Erasmus Valencia', 'Erasmus Life', 'Erasmus students Valencia',
    'events Valencia students', 'trips Valencia', 'Erasmus community',
    'Erasmus Valencia parties', 'student housing Valencia',
    'Erasmus Valencia 2025', 'international students Valencia',
  ],
  authors:  [{ name: 'Erasmus Life Valencia' }],
  icons: {
    icon:     '/logo.png',
    shortcut: '/logo.png',
    apple:    '/logo.png',
  },
  openGraph: {
    type:        'website',
    locale:      'en_US',
    siteName:    'Erasmus Life Valencia',
    title:       'Erasmus Life Valencia',
    description: 'The official platform for Erasmus students in Valencia. Book events, trips, find housing and join the community.',
    images:      [{ url: '/logo.png' }],
  },
  twitter: {
    card:        'summary',
    title:       'Erasmus Life Valencia',
    description: 'The official platform for Erasmus students in Valencia. Events, trips, parties and more. Since 1994.',
    images:      ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full scroll-smooth dark`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
