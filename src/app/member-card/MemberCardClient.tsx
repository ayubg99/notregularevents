'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MembershipRow } from '@/types/database'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PLAN_LABELS: Record<string, string> = {
  basic:   'Monthly',
  premium: 'Semester',
  vip:     'Annual',
}

const COUNTRY_CODES: Record<string, string> = {
  german: 'DE', french: 'FR', spanish: 'ES', italian: 'IT',
  portuguese: 'PT', dutch: 'NL', belgian: 'BE', polish: 'PL',
  swedish: 'SE', norwegian: 'NO', danish: 'DK', finnish: 'FI',
  greek: 'GR', turkish: 'TR', romanian: 'RO', hungarian: 'HU',
  czech: 'CZ', slovak: 'SK', croatian: 'HR', slovenian: 'SI',
  bulgarian: 'BG', ukrainian: 'UA', russian: 'RU', british: 'GB',
  american: 'US', canadian: 'CA', australian: 'AU', chinese: 'CN',
  japanese: 'JP', korean: 'KR', brazilian: 'BR', mexican: 'MX',
  argentinian: 'AR', colombian: 'CO', moroccan: 'MA', egyptian: 'EG',
  indian: 'IN', pakistani: 'PK', iranian: 'IR', lebanese: 'LB',
  algerian: 'DZ', tunisian: 'TN', nigerian: 'NG', kenyan: 'KE',
  swiss: 'CH', austrian: 'AT', irish: 'IE', scottish: 'GB',
  welsh: 'GB', latvian: 'LV', lithuanian: 'LT', estonian: 'EE',
  serbian: 'RS', albanian: 'AL', bosnian: 'BA', macedonian: 'MK',
  vietnamese: 'VN', thai: 'TH', indonesian: 'ID', philippine: 'PH',
  filipino: 'PH', malaysian: 'MY', singaporean: 'SG', taiwanese: 'TW',
  saudi: 'SA', emirati: 'AE', kuwaiti: 'KW', jordanian: 'JO',
  peruvian: 'PE', chilean: 'CL', venezuelan: 'VE', ecuadorian: 'EC',
  luxembourgish: 'LU', cypriot: 'CY', maltese: 'MT',
}

function toFlag(nationality: string): string {
  const key = nationality.toLowerCase().trim().replace(/[^a-z]/g, '')
  const code = COUNTRY_CODES[key]
  if (!code) return ''
  return code
    .split('')
    .map(c => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0)))
    .join('')
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface Props {
  membership:  MembershipRow
  displayName: string
  nationality: string | null
  university:  string | null
  qrCodeUrl:   string
}

export default function MemberCardClient({ membership, displayName, nationality, university, qrCodeUrl }: Props) {
  const [installed, setInstalled]       = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS]               = useState(false)
  const [showIOSHint, setShowIOSHint]   = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia('(display-mode: standalone)').matches) { setInstalled(true); return }
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as unknown as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) { setShowIOSHint(true); return }
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const flag        = nationality ? toFlag(nationality) : ''
  const planLabel   = PLAN_LABELS[membership.plan] ?? 'Member'
  const showBanner  = !installed && (isIOS || !!installPrompt)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{
        background:    '#0D0D0D',
        paddingTop:    'max(1.25rem, env(safe-area-inset-top, 1.25rem))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        paddingLeft:   '1.25rem',
        paddingRight:  '1.25rem',
      }}
    >
      {/* Top nav */}
      <div className="w-full max-w-sm flex items-center justify-between py-2">
        <Link
          href="/dashboard"
          className="text-white/40 text-sm hover:text-white/65 transition-colors"
        >
          ← Dashboard
        </Link>
        <span className="text-white/25 text-xs tracking-widest font-mono">MEMBER CARD</span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(145deg, #FF6B00 0%, #E91E8C 55%, #E05828 100%)' }}
      >
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div className="relative p-6 z-10">

          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>🌴</span>
              <span style={{ color: '#1A1A0E', fontSize: 14, fontWeight: 800, letterSpacing: '0.07em' }}>
                ERASMUS VIBE
              </span>
            </div>
            <Image src="/logo.png" alt="Erasmus Vibe" width={40} height={40} className="rounded-full flex-shrink-0" />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.15)', marginBottom: 20 }} />

          {/* Identity */}
          <div className="mb-5">
            <p style={{ color: '#1A1A0E', fontSize: 22, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.25 }}>
              {displayName}
            </p>
            {(flag || nationality) && (
              <p style={{ color: 'rgba(26,26,14,0.65)', fontSize: 14, margin: 0 }}>
                {flag && <span style={{ marginRight: 5 }}>{flag}</span>}
                {nationality}
              </p>
            )}
            {university && (
              <p style={{ color: 'rgba(26,26,14,0.55)', fontSize: 12, margin: '2px 0 0' }}>{university}</p>
            )}
          </div>

          {/* QR code */}
          <div className="flex justify-center mb-5">
            <div className="rounded-2xl p-3" style={{ background: '#FFF8E8' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeUrl} alt="Member QR code" width={188} height={188} />
            </div>
          </div>

          {/* Plan + validity */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(0,0,0,0.13)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ color: '#1A1A0E', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {planLabel} Member
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(26,26,14,0.18)', color: '#1A1A0E' }}>
                ✓ Active
              </span>
            </div>
            <p style={{ color: 'rgba(26,26,14,0.60)', fontSize: 11, margin: '0 0 2px' }}>
              Member since {fmt(membership.start_date)}
            </p>
            {membership.end_date && (
              <p style={{ color: 'rgba(26,26,14,0.60)', fontSize: 11, margin: 0 }}>
                Valid until {fmt(membership.end_date)}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Add to Home Screen banner */}
      {showBanner ? (
        <button
          onClick={handleInstall}
          className="w-full max-w-sm py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5"
          style={{
            background: 'rgba(255,255,255,0.07)',
            color:      'rgba(255,255,255,0.70)',
            border:     '1px solid rgba(255,255,255,0.10)',
          }}
        >
          Add to Home Screen
        </button>
      ) : (
        <div className="h-12 w-full max-w-sm" />
      )}

      {/* iOS instructions bottom sheet */}
      {showIOSHint && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl"
            style={{ background: '#1E1E36', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col p-6 pb-10">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-lg text-center mb-1">Add to Home Screen</h3>
              <p className="text-white/45 text-sm text-center mb-6">Open in Safari, then follow these steps:</p>

              {(
                [
                  { n: 1, text: <>Tap the <strong className="text-white">Share ↑</strong> button at the bottom of Safari</> },
                  { n: 2, text: <>Scroll down and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong></> },
                  { n: 3, text: <>Tap <strong className="text-white">Add</strong> — your card will be on your home screen</> },
                ] as const
              ).map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3 mb-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,107,0,0.18)', color: '#FF6B00' }}
                  >
                    {n}
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed">{text}</p>
                </div>
              ))}

              <button
                onClick={() => setShowIOSHint(false)}
                className="mt-2 w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
