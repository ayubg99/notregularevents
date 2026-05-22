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
  openGraph: {
    type:        'website',
    locale:      'en_US',
    siteName:    'Erasmus Vibe Valencia',
    title:       'Erasmus Vibe Valencia',
    description: 'The international community in Valencia, Spain. Events, trips and connections for expats, students and professionals.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Erasmus Vibe Valencia',
    description: 'The international community in Valencia — events, trips and connections for expats, students and professionals.',
    images:      ['/og-default.png'],
  },
}

// Inline script to set dark/light class before hydration — prevents flash of wrong theme
const themeInitScript = `
  try {
    var t = localStorage.getItem('theme')
    var d = document.documentElement
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      d.classList.add('dark')
    }
  } catch(e) {}
`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full scroll-smooth`}
    >
      <head>
        {/* Clash Display — not on Google Fonts; self-host via /public/fonts for production */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* Theme initialisation — runs before React hydration to prevent FOWT */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
