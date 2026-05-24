export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { rejectBooking } from '@/lib/booking-utils'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()

  const { data: expired } = await admin
    .from('room_contacts')
    .select('booking_ref')
    .eq('status', 'pending')
    .lt('confirmation_deadline', new Date().toISOString())

  if (!expired || expired.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const results = await Promise.allSettled(
    expired.map(({ booking_ref }) =>
      rejectBooking(booking_ref, 'No response within 48 hours', admin),
    ),
  )

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed    = results.length - succeeded

  console.log(`[check-expired] processed ${expired.length} expired bookings: ${succeeded} refunded, ${failed} failed`)

  return NextResponse.json({ processed: expired.length, succeeded, failed })
}
