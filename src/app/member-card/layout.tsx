import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'My Member Card — Erasmus Life',
  description: 'Your Erasmus Life membership card',
  manifest: '/manifest-member-card.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EV Card',
  },
}

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function MemberCardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
