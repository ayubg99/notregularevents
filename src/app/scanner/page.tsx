'use client'

import { useState, useEffect, useRef } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import Image from 'next/image'

type ScanResult = {
  valid: boolean
  alreadyScanned?: boolean
  error?: string
  booking?: {
    id: string
    guest_name: string | null
    title: string
    booking_ref: string
    checked_in_at: string | null
    type: 'event' | 'trip'
  }
}

export default function ScannerPage() {
  const [pin, setPin]               = useState('')
  const [unlocked, setUnlocked]     = useState(false)
  const [pinError, setPinError]     = useState('')
  const [scanning, setScanning]     = useState(false)
  const [result, setResult]         = useState<ScanResult | null>(null)
  const [checkedIn, setCheckedIn]   = useState(false)
  const [checkinCount, setCheckinCount] = useState(0)
  const [manualRef, setManualRef]   = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  function playBeep() {
    try {
      const ctx  = new AudioContext()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  async function handleLookup(bookingRef: string) {
    const ref = bookingRef.toUpperCase().trim()
    if (!ref) return
    const res  = await fetch(`/api/scanner/lookup?ref=${encodeURIComponent(ref)}`)
    const data = await res.json() as ScanResult
    setResult(data)
    setCheckedIn(false)
  }

  async function handleCheckIn(bookingId: string, type: 'event' | 'trip') {
    const res  = await fetch('/api/scanner/checkin', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookingId, type }),
    })
    const data = await res.json()
    if (data.success) {
      setCheckedIn(true)
      setCheckinCount(prev => prev + 1)
    }
  }

  useEffect(() => {
    if (!scanning || !videoRef.current) return

    const codeReader = new BrowserQRCodeReader()
    let stopped = false

    codeReader.decodeFromVideoDevice(undefined, videoRef.current, (res) => {
      if (stopped || !res) return
      stopped = true
      setScanning(false)
      playBeep()
      handleLookup(res.getText())
    })

    return () => {
      stopped = true
      BrowserQRCodeReader.releaseAllStreams()
    }
  }, [scanning])

  async function handlePinSubmit() {
    setPinError('')
    try {
      const res  = await fetch('/api/scanner/validate-pin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (data.valid) {
        setUnlocked(true)
      } else {
        setPinError('Wrong PIN. Try again.')
        setPin('')
      }
    } catch {
      setPinError('Connection error. Try again.')
    }
  }

  // ── PIN screen ──────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white/5 rounded-2xl p-10 text-center">
          <Image
            src="/logo-circle.png"
            alt="Erasmus Life"
            width={64}
            height={64}
            className="rounded-full mx-auto mb-5"
          />
          <h1 className="text-[#FF6B00] text-xl font-bold mb-2">Staff Access</h1>
          <p className="text-white/50 text-sm mb-8">Enter PIN to access scanner</p>

          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            placeholder="••••"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-2xl text-center tracking-widest mb-4 outline-none focus:border-[#FF6B00] transition-colors"
          />

          {pinError && (
            <p className="text-red-400 text-sm mb-4">{pinError}</p>
          )}

          <button
            onClick={handlePinSubmit}
            className="w-full py-3.5 bg-[#FF6B00] text-[#0D0D0D] rounded-full font-bold text-base hover:bg-[#e59920] transition-colors"
          >
            Unlock Scanner
          </button>
        </div>
      </div>
    )
  }

  // ── Scanner screen ───────────────────────────────────────────────
  const statusColor = result?.valid
    ? 'border-green-500 bg-green-500/10'
    : result?.alreadyScanned
      ? 'border-orange-400 bg-orange-400/10'
      : 'border-red-500 bg-red-500/10'

  const statusIcon = result?.valid ? '✅' : result?.alreadyScanned ? '⚠️' : '❌'

  const statusText = result?.valid
    ? 'VALID TICKET'
    : result?.alreadyScanned
      ? 'ALREADY CHECKED IN'
      : result
        ? (result.error ?? 'INVALID TICKET')
        : ''

  const statusTextColor = result?.valid
    ? 'text-green-400'
    : result?.alreadyScanned
      ? 'text-orange-400'
      : 'text-red-400'

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center p-5">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[#FF6B00] text-lg font-bold">🎟️ Ticket Scanner</h1>
          <span className="bg-white/5 rounded-full px-3 py-1 text-xs text-white/50">
            {checkinCount} checked in
          </span>
        </div>

        {/* Camera viewfinder */}
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden mb-6 border-2 transition-colors ${scanning ? 'border-[#FF6B00]' : 'border-white/10'} bg-black`}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Corner brackets */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48">
              {(['tl','tr','bl','br'] as const).map(c => (
                <span
                  key={c}
                  className={`absolute w-8 h-8 border-[#FF6B00] border-[3px]
                    ${c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0' : ''}
                    ${c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0' : ''}
                    ${c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0' : ''}
                    ${c === 'br' ? 'bottom-0 right-0 border-l-0 border-t-0' : ''}
                  `}
                />
              ))}
            </div>
          </div>

          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-white/40 text-sm">Camera off</p>
            </div>
          )}
        </div>

        {/* Scan toggle button */}
        {!scanning ? (
          <button
            onClick={() => { setScanning(true); setResult(null) }}
            className="w-full py-4 bg-[#FF6B00] text-[#0D0D0D] rounded-full font-bold text-base mb-3 hover:bg-[#e59920] transition-colors"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={() => { setScanning(false); setResult(null) }}
            className="w-full py-4 bg-white/10 text-white rounded-full font-bold text-base mb-3 hover:bg-white/15 transition-colors"
          >
            Stop Scanning
          </button>
        )}

        {/* Manual entry */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={manualRef}
            onChange={e => setManualRef(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && manualRef.trim()) {
                handleLookup(manualRef)
                setManualRef('')
              }
            }}
            placeholder="Or enter booking ref manually"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white text-sm placeholder:text-white/30 outline-none focus:border-[#FF6B00] transition-colors"
          />
          <button
            onClick={() => {
              if (manualRef.trim()) {
                handleLookup(manualRef)
                setManualRef('')
              }
            }}
            className="px-5 py-3 bg-white/10 text-white rounded-full text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            Check
          </button>
        </div>

        {/* Result card */}
        {result && (
          <div className={`rounded-2xl border p-6 text-center ${statusColor}`}>
            <p className="text-5xl mb-2">{statusIcon}</p>
            <p className={`text-lg font-bold mb-4 ${statusTextColor}`}>{statusText}</p>

            {result.booking && (
              <div className="text-left border-t border-white/10 pt-4 mt-2">
                <p className="text-white font-semibold text-lg mb-1">
                  {result.booking.guest_name ?? 'Member'}
                </p>
                <p className="text-white/60 text-sm mb-1">{result.booking.title}</p>
                <p className="text-white/40 text-xs font-mono mb-4">
                  Ref: {result.booking.booking_ref}
                </p>

                {result.booking.checked_in_at && (
                  <p className="text-orange-400 text-xs mb-4">
                    Checked in at: {new Date(result.booking.checked_in_at).toLocaleTimeString()}
                  </p>
                )}

                {result.valid && !checkedIn && (
                  <button
                    onClick={() => handleCheckIn(result.booking!.id, result.booking!.type)}
                    className="w-full py-3.5 bg-green-500 text-white rounded-full font-bold text-base hover:bg-green-400 transition-colors mb-3"
                  >
                    Check In ✓
                  </button>
                )}

                {checkedIn && (
                  <p className="text-green-400 font-bold text-center mb-3">
                    ✅ Checked in successfully!
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => { setResult(null); setCheckedIn(false); setScanning(true) }}
              className="mt-2 w-full py-3 bg-transparent text-white/40 border border-white/10 rounded-full text-sm hover:text-white/60 transition-colors"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
