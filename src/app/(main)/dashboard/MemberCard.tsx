'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { MembershipRow } from '@/types/database'

interface Props {
  membership:  MembershipRow
  displayName: string
  nationality: string | null
  university:  string | null
  qrCodeUrl:   string | null
}

const PLAN_LABELS: Record<string, string> = {
  basic:   'Monthly Member',
  premium: 'Semester Member',
  vip:     'Annual Member',
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

const dark      = '#1A1A0E'
const darkMuted = 'rgba(26,26,14,0.55)'
const darkFaint = 'rgba(26,26,14,0.35)'

export default function MemberCard({ membership, displayName, nationality, university, qrCodeUrl }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText('ERASMUSVIBE').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const flag = nationality ? toFlag(nationality) : ''

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #E91E8C 100%)' }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -24, right: -24, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -48, right: 32, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

      <div className="relative p-5" style={{ zIndex: 1 }}>

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 16 }}>🌴</span>
            <span style={{ color: dark, fontSize: 13, fontWeight: 800, letterSpacing: '0.05em' }}>
              ERASMUS VIBE
            </span>
          </div>
          <Image src="/logo.png" alt="Erasmus Vibe" width={36} height={36} className="rounded-full flex-shrink-0" />
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.15)', margin: '0 0 14px' }} />

        {/* Identity row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Left — name, nationality, university */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <p style={{ color: dark, fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              {displayName}
            </p>
            {(flag || nationality) && (
              <p style={{ color: darkMuted, fontSize: 13, margin: 0 }}>
                {flag && <span style={{ marginRight: 4 }}>{flag}</span>}
                {nationality}
              </p>
            )}
            {university && (
              <p style={{ color: darkMuted, fontSize: 12, margin: 0 }}>{university}</p>
            )}
          </div>

          {/* Right — QR code */}
          {qrCodeUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt="Member QR"
              style={{ width: 76, height: 76, borderRadius: 8, flexShrink: 0 }}
            />
          )}
        </div>

        {/* Plan + dates */}
        <div className="mb-4">
          <p style={{ color: dark, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px' }}>
            {PLAN_LABELS[membership.plan] ?? 'Member'}
          </p>
          <p style={{ color: darkMuted, fontSize: 11, margin: '0 0 1px' }}>
            Member since {fmt(membership.start_date)}
          </p>
          {membership.end_date && (
            <p style={{ color: darkMuted, fontSize: 11, margin: 0 }}>
              Valid until {fmt(membership.end_date)}
            </p>
          )}
        </div>

        {/* Code + copy */}
        <div
          className="flex items-center justify-between"
          style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 10, padding: '8px 12px' }}
        >
          <div>
            <p style={{ color: darkFaint, fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Member Code
            </p>
            <p style={{ color: dark, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              ERASMUSVIBE
            </p>
          </div>
          <button
            onClick={handleCopy}
            style={{ background: 'rgba(0,0,0,0.18)', border: 'none', borderRadius: 7, padding: '5px 11px', color: dark, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Link to full-screen card */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', marginTop: 14, paddingTop: 12, textAlign: 'center' }}>
          <a
            href="/member-card"
            style={{ color: darkMuted, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            Open full card →
          </a>
        </div>

      </div>
    </div>
  )
}
