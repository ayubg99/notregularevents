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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'),
  title: {
    default:  'Erasmus Vibe Valencia',
    template: '%s | Erasmus Vibe Valencia',
  },
  description:
    'The international community in Valencia, Spain. Events, trips and connections for expats, students, digital nomads and young professionals.',
  keywords: [
    'Valencia expats', 'international community Valencia', 'things to do Valencia expats',
    'meet people Valencia', 'Valencia digital nomads', 'international students Valencia',
    'English speaking events Valencia', 'expat events Valencia',
    'Valencia networking', 'Erasmus Valencia',
  ],
  authors:  [{ name: 'Erasmus Vibe Valencia' }],
  icons: {
    icon:     '/logo.png',
    shortcut: '/logo.png',
    apple:    '/logo.png',
  },
  openGraph: {
    type:        'website',
    locale:      'en_US',
    siteName:    'Erasmus Vibe Valencia',
    title:       'Erasmus Vibe Valencia',
    description: 'The international community in Valencia, Spain. Events, trips and connections for expats, students and professionals.',
    images:      [{ url: '/logo.png' }],
  },
  twitter: {
    card:        'summary',
    title:       'Erasmus Vibe Valencia',
    description: 'The international community in Valencia — events, trips and connections for expats, students and professionals.',
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
        {/* Clash Display — not on Google Fonts; self-host via /public/fonts for production */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
