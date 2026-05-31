'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ReferralCapture() {
  const params = useSearchParams()
  useEffect(() => {
    const ref = params.get('ref')
    if (ref) localStorage.setItem('referral_code', ref.toUpperCase())
  }, [params])
  return null
}
