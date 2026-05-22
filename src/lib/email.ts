import { getResend } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/lib/emails/BookingConfirmationEmail'

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

  const html = BookingConfirmationEmail({ ...params, baseUrl })

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `Booking Confirmed — ${params.title} (Ref: ${params.bookingRef})`,
      html,
    })
    if (error) console.error('[email] send failed:', error)
  } catch (err) {
    console.error('[email] unexpected error:', err)
  }
}
