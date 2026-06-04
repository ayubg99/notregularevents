import { getResend } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/lib/emails/BookingConfirmationEmail'
import { MembershipWelcomeEmail } from '@/lib/emails/MembershipWelcomeEmail'
import { JobManagementEmail } from '@/lib/emails/JobManagementEmail'
import { emailLayout } from '@/lib/emails/emailLayout'

interface RefundEmailParams {
  email:     string
  name:      string
  tripTitle: string
  amount:    number
  reason:    string
}

export async function sendRefundEmail({ email, name, tripTitle, amount, reason }: RefundEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hi ${name},
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      We're sorry for the inconvenience.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,68,68,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          <p style="font-size:32px;margin:0 0 8px;">💸</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FF4444;">Refund Processed</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${tripTitle}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Refund Details
          </p>
          <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#2ECC71;">
            €${amount.toFixed(2)} refunded
          </p>
          <p style="margin:0;font-size:13px;color:#B8A090;">
            ⏱ Typically appears within 5–10 business days depending on your bank.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:15px;color:#FFF8EE;line-height:1.6;">
      Unfortunately <strong>${tripTitle}</strong> has been cancelled. ${reason}
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      We hope to see you on the next trip! 🌍
    </p>
  `

  const html = emailLayout(content, baseUrl)

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
  to:           string
  name:         string
  bookingRef:   string
  qrCode:       string
  title:        string
  type:         'event' | 'trip'
  date?:        string
  location?:    string
  whatsappUrl?: string
  isFree?:      boolean
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
      subject: params.isFree
        ? `🎉 You're registered — ${params.title} (Ref: ${params.bookingRef})`
        : `Booking Confirmed — ${params.title} (Ref: ${params.bookingRef})`,
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

// ─── Partner Room Booking Emails ─────────────────────────────

interface BookingPendingEmailParams {
  to:             string
  guestName:      string
  roomTitle:      string
  neighborhood?:  string
  monthlyRent?:   number
  depositAmount?: number
  moveInDate?:    string
  duration?:      string
  bookingRef:     string
}

export async function sendBookingPendingEmail(params: BookingPendingEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hey ${params.guestName} 👋
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      Your payment was successful — the landlord has been notified and will confirm within 48 hours.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,107,0,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="font-size:32px;margin:0 0 8px;">⏳</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FF6B00;">Booking Pending</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${params.roomTitle}${params.neighborhood ? ` · ${params.neighborhood}` : ''}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Booking Details
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:5px 0;font-size:14px;color:#B8A090;">Room</td>
              <td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;font-weight:600;">${params.roomTitle}</td>
            </tr>
            ${params.neighborhood ? `<tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Neighborhood</td><td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">${params.neighborhood}</td></tr>` : ''}
            ${params.monthlyRent !== undefined ? `<tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Monthly rent</td><td style="padding:5px 0;font-size:14px;color:#FF6B00;font-weight:700;text-align:right;">€${params.monthlyRent}/month</td></tr>` : ''}
            ${params.depositAmount !== undefined ? `<tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Deposit</td><td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">€${params.depositAmount}</td></tr>` : ''}
            ${params.moveInDate ? `<tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Move-in date</td><td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">${params.moveInDate}</td></tr>` : ''}
            ${params.duration ? `<tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Duration</td><td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">${params.duration} month(s)</td></tr>` : ''}
            <tr><td style="padding:5px 0;font-size:14px;color:#B8A090;">Booking fee paid</td><td style="padding:5px 0;font-size:14px;color:#2ECC71;font-weight:700;text-align:right;">€50 ✓</td></tr>
          </table>
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,248,238,0.06);">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Booking Reference</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#E91E8C;letter-spacing:0.12em;">${params.bookingRef}</p>
          </div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            What Happens Next
          </p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">1️⃣ &nbsp;Landlord receives your booking request</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">2️⃣ &nbsp;They confirm within 48 hours</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">3️⃣ &nbsp;You receive their contact details by email</p>
          <p style="margin:0;font-size:14px;color:#FFF8EE;">4️⃣ &nbsp;Schedule your viewing and arrange the contract</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(46,204,113,0.2);border-radius:16px;margin-bottom:32px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;font-size:14px;color:#FFF8EE;line-height:1.6;">
            🛡️ <strong style="color:#2ECC71;">Full refund guarantee:</strong> If the landlord doesn't confirm within 48 hours, you'll receive a full automatic refund of €50 — no questions asked.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${baseUrl}/housing"
             style="display:inline-block;border:1px solid rgba(255,248,238,0.18);color:#FFF8EE;
                    font-weight:600;font-size:14px;text-decoration:none;padding:13px 32px;
                    border-radius:9999px;">
            ← Browse More Rooms
          </a>
        </td>
      </tr>
    </table>
  `

  const html = emailLayout(content, baseUrl)

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `⏳ Booking pending — ${params.roomTitle}`,
      html,
    })
    if (error) console.error('[email booking-pending] send failed:', error)
  } catch (err) {
    console.error('[email booking-pending] unexpected error:', err)
  }
}

interface PartnerConfirmationRequestParams {
  to:               string
  partnerName:      string
  guestName:        string
  guestEmail:       string
  guestPhone:       string
  guestNationality: string
  university:       string
  roomTitle:        string
  moveInDate:       string
  duration:         string
  message:          string
  bookingRef:       string
  confirmUrl:       string
  rejectUrl:        string
}

export async function sendPartnerConfirmationRequest(params: PartnerConfirmationRequestParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hi ${params.partnerName},
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      A student has paid €50 to book your room <strong style="color:#FFF8EE;">${params.roomTitle}</strong>.
      Please confirm or reject within <strong style="color:#FFF8EE;">48 hours</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,107,0,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">🔔 New Booking Request</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#FFF8EE;">${params.roomTitle}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Student Details
          </p>
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#FFF8EE;">${params.guestName}</p>
          ${params.guestEmail ? `<p style="margin:0 0 6px;font-size:14px;color:#B8A090;">✉️ &nbsp;${params.guestEmail}</p>` : ''}
          ${params.guestPhone ? `<p style="margin:0 0 6px;font-size:14px;color:#B8A090;">📱 &nbsp;${params.guestPhone}</p>` : ''}
          ${params.guestNationality ? `<p style="margin:0 0 6px;font-size:14px;color:#B8A090;">🌍 &nbsp;${params.guestNationality}</p>` : ''}
          ${params.university ? `<p style="margin:0;font-size:14px;color:#B8A090;">🏫 &nbsp;${params.university}</p>` : ''}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Move-In Details
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:5px 0;font-size:14px;color:#B8A090;">Move-in</td>
              <td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;font-weight:600;">${params.moveInDate}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:14px;color:#B8A090;">Duration</td>
              <td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">${params.duration} month(s)</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${params.message ? `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Student Message
          </p>
          <p style="margin:0;font-style:italic;color:#FFF8EE;font-size:14px;line-height:1.6;">"${params.message}"</p>
        </td>
      </tr>
    </table>` : ''}

    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#FFF8EE;">Please confirm or reject this booking:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:6px;">
          <a href="${params.confirmUrl}"
             style="display:block;background:#2ECC71;color:#fff;text-align:center;padding:16px 24px;
                    border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px;">
            ✅ CONFIRM BOOKING
          </a>
        </td>
        <td style="padding-left:6px;">
          <a href="${params.rejectUrl}"
             style="display:block;background:#FF4444;color:#fff;text-align:center;padding:16px 24px;
                    border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px;">
            ❌ REJECT BOOKING
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,68,68,0.15);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#B8A090;line-height:1.6;">
            ⚠️ If you do not respond within 48 hours, the booking will be automatically cancelled and the student will receive a full refund.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 4px;font-size:12px;color:#B8A090;">
      Booking reference: <strong style="font-family:'Courier New',monospace;color:#E91E8C;letter-spacing:0.08em;">${params.bookingRef}</strong>
    </p>
  `

  const html = emailLayout(
    content,
    baseUrl,
    `Need help? Contact us at <a href="mailto:info@erasmusvibe.com" style="color:#FF6B00;">info@erasmusvibe.com</a> · Powered by Erasmus Vibe`,
  )

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `🔔 New booking request for ${params.roomTitle} — action required`,
      html,
    })
    if (error) console.error('[email partner-confirmation-request] send failed:', error)
  } catch (err) {
    console.error('[email partner-confirmation-request] unexpected error:', err)
  }
}

interface BookingRefundEmailParams {
  to:         string
  guestName:  string
  roomTitle:  string
  amount:     number
  bookingRef: string
  reason:     string
}

export async function sendBookingRefundEmail(params: BookingRefundEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hi ${params.guestName},
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      We're sorry this didn't work out. ${params.reason}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,68,68,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          <p style="font-size:32px;margin:0 0 8px;">💸</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FF4444;">Refund Processed</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${params.roomTitle}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Refund Details
          </p>
          <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#2ECC71;">
            €${params.amount.toFixed(2)} refunded
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#B8A090;">${params.roomTitle}</p>
          <p style="margin:0 0 16px;font-size:13px;color:#B8A090;">
            ⏱ Typically appears within 5–10 business days depending on your bank.
          </p>
          <div style="padding-top:14px;border-top:1px solid rgba(255,248,238,0.06);">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Booking Reference</p>
            <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#E91E8C;letter-spacing:0.1em;">${params.bookingRef}</p>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      We hope to help you find your perfect room soon — there are plenty of other great options waiting!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${baseUrl}/housing"
             style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                    font-size:14px;text-decoration:none;padding:14px 32px;border-radius:9999px;">
            Browse Other Rooms →
          </a>
        </td>
      </tr>
    </table>
  `

  const html = emailLayout(content, baseUrl)

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `💸 Refund processed — ${params.roomTitle}`,
      html,
    })
    if (error) console.error('[email booking-refund] send failed:', error)
  } catch (err) {
    console.error('[email booking-refund] unexpected error:', err)
  }
}

// ─── Partner Room Emails ──────────────────────────────────────

interface RoomContactEmailParams {
  to:                 string
  guestName:          string
  roomTitle:          string
  neighborhood:       string
  partnerName:        string
  partnerWhatsapp:    string
  partnerEmail:       string
  partnerPhone:       string
  partnerContactName: string
  moveInDate:         string
  duration:           string
  bookingRef:         string
}

export async function sendRoomContactEmail(params: RoomContactEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const waNumber  = params.partnerWhatsapp.replace(/[^0-9]/g, '')
  const waMessage = encodeURIComponent(
    `Hi ${params.partnerContactName || params.partnerName}! I'm ${params.guestName} and I found your room "${params.roomTitle}" on Erasmus Vibe. I'm interested in moving in on ${params.moveInDate}. Is it still available?`,
  )
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : ''

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Great news, ${params.guestName}! 🎉
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      The landlord confirmed your booking for <strong style="color:#FFF8EE;">${params.roomTitle}</strong>. Here are their contact details — reach out to arrange your viewing!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(46,204,113,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="font-size:32px;margin:0 0 8px;">✅</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#2ECC71;">Contact Unlocked!</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${params.roomTitle} · ${params.neighborhood}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Landlord Contact
          </p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#FFF8EE;">${params.partnerName}</p>
          ${params.partnerContactName ? `<p style="margin:0 0 8px;font-size:14px;color:#B8A090;">Contact person: ${params.partnerContactName}</p>` : ''}
          ${params.partnerWhatsapp ? `<p style="margin:0 0 8px;font-size:15px;color:#FFF8EE;">📱 &nbsp;WhatsApp: <a href="https://wa.me/${params.partnerWhatsapp.replace(/[^0-9]/g, '')}" style="color:#25D366;font-weight:600;">${params.partnerWhatsapp}</a></p>` : ''}
          ${params.partnerEmail ? `<p style="margin:0 0 8px;font-size:15px;color:#FFF8EE;">✉️ &nbsp;Email: <a href="mailto:${params.partnerEmail}" style="color:#FF6B00;font-weight:600;">${params.partnerEmail}</a></p>` : ''}
          ${params.partnerPhone ? `<p style="margin:0;font-size:15px;color:#FFF8EE;">📞 &nbsp;Phone: <strong>${params.partnerPhone}</strong></p>` : ''}
        </td>
      </tr>
    </table>

    ${waLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${waLink}"
             style="display:inline-block;background:#25D366;color:#fff;font-weight:700;
                    font-size:14px;text-decoration:none;padding:14px 32px;border-radius:9999px;">
            💬 &nbsp;Message on WhatsApp
          </a>
        </td>
      </tr>
    </table>` : ''}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            What Happens Next
          </p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">1️⃣ &nbsp;Contact the landlord on WhatsApp or email</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">2️⃣ &nbsp;Schedule a viewing at a convenient time</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">3️⃣ &nbsp;Sign the rental contract</p>
          <p style="margin:0;font-size:14px;color:#FFF8EE;">4️⃣ &nbsp;Pay rent + deposit directly to the landlord</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#B8A090;">
      Move-in: <strong style="color:#FFF8EE;">${params.moveInDate}</strong> &nbsp;·&nbsp; Duration: <strong style="color:#FFF8EE;">${params.duration} month(s)</strong>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.06);border-radius:16px;margin-bottom:32px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#B8A090;line-height:1.6;">
            ℹ️ <strong style="color:#FFF8EE;">Please note:</strong> Monthly rent and deposit are paid <strong style="color:#FFF8EE;">directly to the landlord</strong>, not through Erasmus Vibe. The €50 booking fee covers our platform service only.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 4px;font-size:12px;color:#B8A090;">
      Booking reference: <strong style="font-family:'Courier New',monospace;color:#E91E8C;letter-spacing:0.08em;">${params.bookingRef}</strong>
    </p>
  `

  const html = emailLayout(content, baseUrl)

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `✅ Contact Unlocked — ${params.roomTitle} (Ref: ${params.bookingRef})`,
      html,
    })
    if (error) console.error('[email room-contact] send failed:', error)
  } catch (err) {
    console.error('[email room-contact] unexpected error:', err)
  }
}

interface PartnerNotificationEmailParams {
  to:               string
  partnerName:      string
  guestName:        string
  guestEmail:       string
  guestPhone:       string
  guestNationality: string
  university:       string
  roomTitle:        string
  moveInDate:       string
  duration:         string
  message:          string
}

export async function sendPartnerNotificationEmail(params: PartnerNotificationEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hi ${params.partnerName},
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      A student has purchased your contact details via Erasmus Vibe and will be reaching out soon.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,107,0,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">New Room Enquiry</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#FFF8EE;">${params.roomTitle}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Student Details
          </p>
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#FFF8EE;">${params.guestName}</p>
          ${params.guestEmail ? `<p style="margin:0 0 8px;font-size:14px;color:#B8A090;">✉️ &nbsp;${params.guestEmail}</p>` : ''}
          ${params.guestPhone ? `<p style="margin:0 0 8px;font-size:14px;color:#B8A090;">📱 &nbsp;${params.guestPhone}</p>` : ''}
          ${params.guestNationality ? `<p style="margin:0 0 8px;font-size:14px;color:#B8A090;">🌍 &nbsp;${params.guestNationality}</p>` : ''}
          ${params.university ? `<p style="margin:0;font-size:14px;color:#B8A090;">🏫 &nbsp;${params.university}</p>` : ''}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Move-In Details
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:5px 0;font-size:14px;color:#B8A090;">Move-in</td>
              <td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;font-weight:600;">${params.moveInDate}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:14px;color:#B8A090;">Duration</td>
              <td style="padding:5px 0;font-size:14px;color:#FFF8EE;text-align:right;">${params.duration} month(s)</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${params.message ? `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Their Message</p>
          <p style="margin:0;font-style:italic;color:#FFF8EE;font-size:14px;line-height:1.6;">"${params.message}"</p>
        </td>
      </tr>
    </table>` : ''}
  `

  const html = emailLayout(
    content,
    baseUrl,
    `Powered by Erasmus Vibe · <a href="https://instagram.com/erasmus_vibe" style="color:#FF6B00;">@erasmus_vibe</a>`,
  )

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `New enquiry for ${params.roomTitle} — ${params.guestName}`,
      html,
    })
    if (error) console.error('[email partner-notification] send failed:', error)
  } catch (err) {
    console.error('[email partner-notification] unexpected error:', err)
  }
}

interface GroupBookingEmailParams {
  to:             string
  leadName:       string
  eventTitle:     string
  eventDate?:     string
  eventLocation?: string
  tickets:        { name: string; bookingRef: string; qrCode: string }[]
  isFree?:        boolean
  type?:          'event' | 'trip'
}

export async function sendGroupBookingConfirmation(params: GroupBookingEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const isTrip  = params.type === 'trip'
  const n       = params.tickets.length
  const scanCopy = isTrip
    ? 'Each person should show their own QR code at the pickup point.'
    : 'Each QR code is unique and can only be scanned once at the door.'

  const dateStr = params.eventDate
    ? new Date(params.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const ticketsHtml = params.tickets.map((t, i) => `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:12px;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#FF6B00;font-weight:700;">
            ${isTrip ? '✈️ Traveller' : 'Ticket'} ${i + 1}${i === 0 ? ' — You' : ''}: ${t.name}
          </p>
          <img src="cid:qr-${i}" width="160" height="160" alt="QR Code"
               style="border-radius:12px;display:block;margin:0 auto;background:#fff;padding:8px;" />
          <p style="margin:10px 0 0;font-family:'Courier New',monospace;font-size:13px;color:#B8A090;letter-spacing:0.12em;">${t.bookingRef}</p>
        </td>
      </tr>
    </table>
  `).join('')

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hey ${params.leadName} 👋
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      Here are all ${n} ${isTrip ? `trip spot${n > 1 ? 's' : ''}` : `ticket${n > 1 ? 's' : ''}`} for your group. ${scanCopy}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,107,0,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#FFF8EE;">${params.eventTitle}</p>
          ${dateStr ? `<p style="margin:4px 0 0;font-size:14px;color:#B8A090;">📅 &nbsp;${dateStr}</p>` : ''}
          ${params.eventLocation ? `<p style="margin:4px 0 0;font-size:14px;color:#B8A090;">📍 &nbsp;${params.eventLocation}</p>` : ''}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
      ${isTrip ? 'Your Travellers' : 'Your Group Tickets'}
    </p>

    ${ticketsHtml}

    <p style="margin:24px 0 0;font-size:13px;color:#B8A090;text-align:center;">${scanCopy}</p>
  `

  const html = emailLayout(content, baseUrl)

  const attachments = params.tickets.map((t, i) => {
    const qrBase64 = t.qrCode.startsWith('data:') ? t.qrCode.split(',')[1] : t.qrCode
    return {
      filename:  `ticket-${i + 1}.png`,
      content:   Buffer.from(qrBase64, 'base64'),
      contentId: `qr-${i}`,
    }
  })

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: isTrip
        ? `✈️ ${n} trip spot${n > 1 ? 's' : ''} — ${params.eventTitle}`
        : params.isFree
          ? `🎉 ${n} free ticket${n > 1 ? 's' : ''} — ${params.eventTitle}`
          : `🎟️ ${n} ticket${n > 1 ? 's' : ''} — ${params.eventTitle}`,
      html,
      attachments,
    })
    if (error) console.error('[email group-booking] send failed:', error)
  } catch (err) {
    console.error('[email group-booking] unexpected error:', err)
  }
}

interface MembershipWelcomeParams {
  to:      string
  name:    string
  plan:    'basic' | 'premium' | 'vip' | 'employer'
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

interface JobManagementEmailParams {
  to:        string
  jobTitle:  string
  company:   string
  viewUrl:   string
  manageUrl: string
  editUrl:   string
}

export async function sendJobManagementEmail(params: JobManagementEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const html    = JobManagementEmail({ ...params, baseUrl })

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `Manage your job listing — ${params.jobTitle}`,
      html,
    })
    if (error) console.error('[email job management] send failed:', error)
  } catch (err) {
    console.error('[email job management] unexpected error:', err)
  }
}

// ─── Ambassador Emails ────────────────────────────────────────

interface AmbassadorApprovalEmailParams {
  to:             string
  name:           string
  referralCode:   string
  referralLink:   string
  commissionRate: number
}

export async function sendAmbassadorApprovalEmail(params: AmbassadorApprovalEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hey ${params.name.split(' ')[0]} 🌟
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      Congratulations! Your application has been approved — you're now an official Erasmus Vibe Ambassador in Valencia.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,107,0,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          <p style="font-size:40px;margin:0 0 12px;">🌟</p>
          <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#FF6B00;">You're an Ambassador!</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">Welcome to the Erasmus Vibe Ambassador Program</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Your Referral Code
          </p>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#FF6B00;letter-spacing:0.1em;">
            ${params.referralCode}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            Your Referral Link
          </p>
          <p style="margin:0;font-size:13px;color:#E91E8C;word-break:break-all;">${params.referralLink}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:32px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
            How It Works
          </p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">🔗 &nbsp;Share your referral link with friends interested in Erasmus Valencia</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">💸 &nbsp;Earn <strong style="color:#FF6B00;">${params.commissionRate}% commission</strong> when they book an event or trip</p>
          <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">📊 &nbsp;Track your earnings and referrals in your dashboard</p>
          <p style="margin:0;font-size:14px;color:#FFF8EE;">🎁 &nbsp;Hit milestones for bonus rewards — free tickets, membership upgrades, cash bonuses</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E91E8C);color:#1A1A0E;
                    font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">
            View Your Dashboard →
          </a>
        </td>
      </tr>
    </table>
  `

  const html = emailLayout(content, baseUrl)

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: "🌟 You're an Erasmus Vibe Ambassador!",
      html,
    })
    if (error) console.error('[email ambassador approval] send failed:', error)
  } catch (err) {
    console.error('[email ambassador approval] unexpected error:', err)
  }
}

interface AmbassadorCommissionEmailParams {
  to:               string
  name:             string
  commissionEarned: number
  bookingTitle:     string
  totalEarnings:    number
}

export async function sendAmbassadorCommissionEmail(params: AmbassadorCommissionEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      Hey ${params.name.split(' ')[0]} 💶
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      Someone just booked using your referral code — congratulations!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(46,204,113,0.2);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          <p style="font-size:36px;margin:0 0 8px;">💶</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#2ECC71;">You earned a commission!</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${params.bookingTitle}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:32px;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#B8A090;">This booking</td>
              <td style="padding:6px 0;font-size:22px;font-weight:700;color:#2ECC71;text-align:right;">+€${params.commissionEarned.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0;"><div style="height:1px;background:rgba(255,248,238,0.06);margin:8px 0;"></div></td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#B8A090;">Total earned</td>
              <td style="padding:6px 0;font-size:18px;font-weight:700;color:#FF6B00;text-align:right;">€${params.totalEarnings.toFixed(2)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E91E8C);color:#1A1A0E;
                    font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">
            View Dashboard →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:14px;color:#B8A090;text-align:center;">Keep sharing your link to earn more. 🚀</p>
  `

  const html = emailLayout(content, baseUrl)

  try {
    const { error } = await getResend().emails.send({
      from,
      to:      params.to,
      subject: `💶 You earned €${params.commissionEarned.toFixed(2)} commission!`,
      html,
    })
    if (error) console.error('[email ambassador commission] send failed:', error)
  } catch (err) {
    console.error('[email ambassador commission] unexpected error:', err)
  }
}
