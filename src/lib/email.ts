import { getResend } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/lib/emails/BookingConfirmationEmail'
import { MembershipWelcomeEmail } from '@/lib/emails/MembershipWelcomeEmail'

interface RefundEmailParams {
  email:     string
  name:      string
  tripTitle: string
  amount:    number
  reason:    string
}

export async function sendRefundEmail({ email, name, tripTitle, amount, reason }: RefundEmailParams) {
  const from = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#F5A623;margin:0 0 24px;">Erasmus Vibe</h1>
      <div style="background:rgba(255,68,68,0.1);border:1px solid #FF4444;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
        <p style="font-size:32px;margin:0;">💸</p>
        <h2 style="color:#FF4444;margin:8px 0;">Refund Processed</h2>
        <p style="color:#888;margin:0;">We are sorry for the inconvenience</p>
      </div>
      <p>Hi ${name},</p>
      <p>Unfortunately <strong>${tripTitle}</strong> has been cancelled. ${reason}</p>
      <p>We have processed a full refund of <strong style="color:#2ECC71;">€${amount.toFixed(2)}</strong> to your original payment method.</p>
      <p style="color:#888;font-size:14px;">Refunds typically appear in your account within 5–10 business days depending on your bank.</p>
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#888;font-size:14px;">Refund details</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#2ECC71;">€${amount.toFixed(2)} refunded</p>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">${tripTitle}</p>
      </div>
      <p>We hope to see you on the next trip! 🌍</p>
      <p style="color:#888;font-size:13px;">Questions? Contact us on Instagram @erasmus_vibe or WhatsApp</p>
    </div>
  `

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      email,
      subject: `Refund processed — ${tripTitle}`,
      html,
    })
    if (error) console.error('[email refund] send failed:', error)
  } catch (err) {
    console.error('[email refund] unexpected error:', err)
  }
}

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
