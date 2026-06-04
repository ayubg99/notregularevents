import { NextRequest, NextResponse } from 'next/server'
import {
  sendBookingPendingEmail,
  sendPartnerConfirmationRequest,
  sendRoomContactEmail,
  sendBookingRefundEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

const TEST_TO = process.env.TEST_EMAIL ?? 'test@erasmuslifevalencia.com'

const FAKE_BOOKING_REF = 'EV-TEST1'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmuslifevalencia.com'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get('type')

  if (type === 'pending') {
    await sendBookingPendingEmail({
      to:            TEST_TO,
      guestName:     'Maria García',
      roomTitle:     'Cozy Private Room in City Centre',
      neighborhood:  'El Carmen',
      monthlyRent:   420,
      depositAmount: 840,
      moveInDate:    '2026-09-01',
      duration:      '10',
      bookingRef:    FAKE_BOOKING_REF,
    })
    return NextResponse.json({ ok: true, sent: 'pending', to: TEST_TO })
  }

  if (type === 'partner') {
    await sendPartnerConfirmationRequest({
      to:               TEST_TO,
      partnerName:      'Carlos Martínez',
      guestName:        'Maria García',
      guestEmail:       'maria@student.com',
      guestPhone:       '+34 612 345 678',
      guestNationality: 'German',
      university:       'University of Valencia (UV)',
      roomTitle:        'Cozy Private Room in City Centre',
      moveInDate:       '2026-09-01',
      duration:         '10',
      message:          'Hi! I\'m very interested in the room. I\'m a tidy, quiet student and would love to arrange a viewing.',
      bookingRef:       FAKE_BOOKING_REF,
      confirmUrl:       `${BASE_URL}/api/housing/confirm-booking?ref=${FAKE_BOOKING_REF}&action=confirm`,
      rejectUrl:        `${BASE_URL}/api/housing/confirm-booking?ref=${FAKE_BOOKING_REF}&action=reject`,
    })
    return NextResponse.json({ ok: true, sent: 'partner', to: TEST_TO })
  }

  if (type === 'contact') {
    await sendRoomContactEmail({
      to:                 TEST_TO,
      guestName:          'Maria García',
      roomTitle:          'Cozy Private Room in City Centre',
      neighborhood:       'El Carmen',
      partnerName:        'Valencia Rooms SL',
      partnerWhatsapp:    '+34 600 123 456',
      partnerEmail:       'carlos@valenciarooms.com',
      partnerPhone:       '+34 963 456 789',
      partnerContactName: 'Carlos',
      moveInDate:         '2026-09-01',
      duration:           '10',
      bookingRef:         FAKE_BOOKING_REF,
    })
    return NextResponse.json({ ok: true, sent: 'contact', to: TEST_TO })
  }

  if (type === 'refund') {
    await sendBookingRefundEmail({
      to:         TEST_TO,
      guestName:  'Maria García',
      roomTitle:  'Cozy Private Room in City Centre',
      amount:     50,
      bookingRef: FAKE_BOOKING_REF,
      reason:     'The landlord was unable to accommodate your requested move-in date and has rejected the booking.',
    })
    return NextResponse.json({ ok: true, sent: 'refund', to: TEST_TO })
  }

  return NextResponse.json(
    {
      error: 'Missing ?type= param',
      options: ['pending', 'partner', 'contact', 'refund'],
      usage: [
        'GET /api/test-emails?type=pending  — student booking pending email',
        'GET /api/test-emails?type=partner  — partner confirmation request',
        'GET /api/test-emails?type=contact  — student contact unlocked email',
        'GET /api/test-emails?type=refund   — student refund email',
      ],
    },
    { status: 400 },
  )
}
