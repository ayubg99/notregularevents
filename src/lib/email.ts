import { getResend } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/lib/emails/BookingConfirmationEmail'
import { MembershipWelcomeEmail } from '@/lib/emails/MembershipWelcomeEmail'

interface BookingConfirmationParams {
  to:          string
  name:        string
  bookingRef:  string
  qrCode:      string
  title:       string
  type:        'event' | 'trip'
  date?:       string
  location?:   string
  whatsappUrl?: string
}

export async function sendBookingConfirmation(params: BookingConfirmationParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'bookings@erasmusvibe.com'

  const { qrCode, ...templateParams } = params
  const html = BookingConfirmationEmail({ ...templateParams, baseUrl })

  // Convert stored data URL to buffer for CID inline attachment
  // (Gmail/Outlook block data: URLs in <img src>)
  const qrBase64 = qrCode.startsWith('data:') ? qrCode.split(',')[1] : qrCode
  const qrBuffer = Buffer.from(qrBase64, 'base64')

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `Booking Confirmed — ${params.title} (Ref: ${params.bookingRef})`,
      html,
      attachments: [{
        filename:  'qr-code.png',
        content:   qrBuffer,
        contentId: 'qr-code',
      }],
    })
    if (error) console.error('[email] send failed:', error)
  } catch (err) {
    console.error('[email] unexpected error:', err)
  }
}

interface MembershipWelcomeParams {
  to:      string
  name:    string
  plan:    'basic' | 'premium' | 'vip'
  endDate: string
}

export async function sendMembershipWelcomeEmail(params: MembershipWelcomeParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'bookings@erasmusvibe.com'
  const html    = MembershipWelcomeEmail({ ...params, baseUrl })

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: '🌴 Welcome to Erasmus Vibe Membership!',
      html,
    })
    if (error) console.error('[email membership] send failed:', error)
  } catch (err) {
    console.error('[email membership] unexpected error:', err)
  }
}
