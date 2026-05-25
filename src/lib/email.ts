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

// ─── Partner Room Booking Emails ─────────────────────────────

interface BookingPendingEmailParams {
  to:            string
  guestName:     string
  roomTitle:     string
  neighborhood?: string
  monthlyRent?:  number
  depositAmount?: number
  moveInDate?:   string
  duration?:     string
  bookingRef:    string
}

export async function sendBookingPendingEmail(params: BookingPendingEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF6B35;margin:0 0 4px;font-size:28px;">Erasmus Vibe</h1>
      <p style="color:#888;margin:0 0 28px;font-size:13px;">Student Housing Valencia</p>
      <div style="background:rgba(245,166,35,0.1);border:1px solid #F5A623;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
        <p style="font-size:32px;margin:0;">⏳</p>
        <h2 style="color:#F5A623;margin:8px 0 4px;">Booking Pending!</h2>
        <p style="color:#aaa;margin:0;font-size:15px;">${params.roomTitle}${params.neighborhood ? ` · ${params.neighborhood}` : ''}</p>
      </div>
      <p>Hi ${params.guestName},</p>
      <p>Your payment of <strong>€50</strong> was successful. The landlord has been notified and will confirm your booking within <strong>48 hours</strong>.</p>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Booking details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 0;">Room</td>
            <td style="color:#fff;font-size:14px;font-weight:600;text-align:right;padding:4px 0;">${params.roomTitle}</td>
          </tr>
          ${params.neighborhood ? `<tr><td style="color:#888;font-size:14px;padding:4px 0;">Neighborhood</td><td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">${params.neighborhood}</td></tr>` : ''}
          ${params.monthlyRent !== undefined ? `<tr><td style="color:#888;font-size:14px;padding:4px 0;">Monthly rent</td><td style="color:#4ECDC4;font-size:14px;font-weight:700;text-align:right;padding:4px 0;">€${params.monthlyRent}/month</td></tr>` : ''}
          ${params.depositAmount !== undefined ? `<tr><td style="color:#888;font-size:14px;padding:4px 0;">Deposit</td><td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">€${params.depositAmount}</td></tr>` : ''}
          ${params.moveInDate ? `<tr><td style="color:#888;font-size:14px;padding:4px 0;">Move-in date</td><td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">${params.moveInDate}</td></tr>` : ''}
          ${params.duration ? `<tr><td style="color:#888;font-size:14px;padding:4px 0;">Duration</td><td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">${params.duration} month(s)</td></tr>` : ''}
          <tr><td style="color:#888;font-size:14px;padding:4px 0;">Booking fee paid</td><td style="color:#2ECC71;font-size:14px;font-weight:700;text-align:right;padding:4px 0;">€50 ✓</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="color:#888;font-size:12px;margin:0 0 4px;">Booking reference</p>
          <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#FF6B35;letter-spacing:2px;">${params.bookingRef}</p>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 12px;font-weight:600;">What happens next</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">1️⃣ Landlord receives your booking request</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">2️⃣ They confirm within 48 hours</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">3️⃣ You receive their contact details by email</p>
        <p style="margin:0;font-size:14px;color:#ccc;">4️⃣ Schedule your viewing and arrange the contract</p>
      </div>
      <div style="background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.3);border-radius:12px;padding:16px;margin:24px 0;">
        <p style="color:#2ECC71;margin:0;font-size:14px;">🛡️ <strong>Full refund guarantee:</strong> If the landlord doesn't confirm within 48 hours, you'll receive a full automatic refund of €50 — no questions asked.</p>
      </div>
      <a href="${baseUrl}/housing" style="display:inline-block;color:#FF6B35;font-size:14px;margin-bottom:24px;">← Browse more rooms</a>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin-top:8px;">
        <p style="color:#555;font-size:12px;margin:0;">Questions? Email us at <a href="mailto:info@erasmusvibe.com" style="color:#FF6B35;">info@erasmusvibe.com</a> or find us on Instagram @erasmus_vibe</p>
      </div>
    </div>
  `

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
  to:              string
  partnerName:     string
  guestName:       string
  guestEmail:      string
  guestPhone:      string
  guestNationality: string
  university:      string
  roomTitle:       string
  moveInDate:      string
  duration:        string
  message:         string
  bookingRef:      string
  confirmUrl:      string
  rejectUrl:       string
}

export async function sendPartnerConfirmationRequest(params: PartnerConfirmationRequestParams) {
  const from = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF6B35;margin:0 0 24px;">Erasmus Vibe</h1>
      <div style="background:rgba(245,166,35,0.15);border:1px solid #F5A623;border-radius:12px;padding:24px;margin:0 0 24px;">
        <h2 style="color:#F5A623;margin:0 0 6px;">🔔 New Booking Request</h2>
        <p style="color:#888;margin:0;">Room: ${params.roomTitle}</p>
      </div>
      <p>Hi ${params.partnerName},</p>
      <p>A student has paid €50 to book your room <strong>${params.roomTitle}</strong>. Please confirm or reject this request within <strong>48 hours</strong>.</p>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 12px;">Student details</p>
        <p style="margin:0 0 6px;font-size:16px;font-weight:600;">${params.guestName}</p>
        ${params.guestEmail ? `<p style="margin:0 0 6px;font-size:14px;color:#ccc;">✉️ ${params.guestEmail}</p>` : ''}
        ${params.guestPhone ? `<p style="margin:0 0 6px;font-size:14px;color:#ccc;">📱 ${params.guestPhone}</p>` : ''}
        ${params.guestNationality ? `<p style="margin:0 0 6px;font-size:14px;color:#ccc;">🌍 ${params.guestNationality}</p>` : ''}
        ${params.university ? `<p style="margin:0;font-size:14px;color:#ccc;">🏫 ${params.university}</p>` : ''}
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 8px;">Move-in details</p>
        <p style="margin:0 0 4px;font-size:14px;">Move-in: <strong>${params.moveInDate}</strong></p>
        <p style="margin:0;font-size:14px;">Duration: <strong>${params.duration} month(s)</strong></p>
      </div>
      ${params.message ? `<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;"><p style="color:#888;font-size:13px;margin:0 0 8px;">Student message</p><p style="margin:0;font-style:italic;color:#ccc;font-size:14px;">"${params.message}"</p></div>` : ''}
      <p style="font-weight:600;font-size:15px;margin:32px 0 16px;">Please confirm or reject this booking:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding-right:8px;">
            <a href="${params.confirmUrl}" style="display:block;background:#2ECC71;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">✅ CONFIRM BOOKING</a>
          </td>
          <td style="padding-left:8px;">
            <a href="${params.rejectUrl}" style="display:block;background:#FF4444;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">❌ REJECT BOOKING</a>
          </td>
        </tr>
      </table>
      <div style="background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:14px;margin-bottom:24px;">
        <p style="color:#FF8888;margin:0;font-size:13px;">⚠️ If you do not respond within 48 hours, the booking will be automatically cancelled and the student will receive a full refund.</p>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Booking reference: <strong style="font-family:monospace;color:#FF6B35;letter-spacing:1px;">${params.bookingRef}</strong></p>
        <p style="color:#555;font-size:12px;margin:4px 0 0;">Need help? Contact us at <a href="mailto:info@erasmusvibe.com" style="color:#FF6B35;">info@erasmusvibe.com</a> · Powered by Erasmus Vibe</p>
      </div>
    </div>
  `

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
  to:          string
  guestName:   string
  roomTitle:   string
  amount:      number
  bookingRef:  string
  reason:      string
}

export async function sendBookingRefundEmail(params: BookingRefundEmailParams) {
  const from    = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF6B35;margin:0 0 4px;font-size:28px;">Erasmus Vibe</h1>
      <p style="color:#888;margin:0 0 28px;font-size:13px;">Student Housing Valencia</p>
      <div style="background:rgba(255,68,68,0.1);border:1px solid #FF4444;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
        <p style="font-size:32px;margin:0;">💸</p>
        <h2 style="color:#FF4444;margin:8px 0;">Refund Processed</h2>
        <p style="color:#888;margin:0;">${params.roomTitle}</p>
      </div>
      <p>Hi ${params.guestName},</p>
      <p>We're sorry this didn't work out. ${params.reason}</p>
      <p>We have processed a full refund of <strong style="color:#2ECC71;">€${params.amount.toFixed(2)}</strong> to your original payment method.</p>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#888;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Refund details</p>
        <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#2ECC71;">€${params.amount.toFixed(2)} refunded</p>
        <p style="margin:0 0 12px;color:#888;font-size:13px;">${params.roomTitle}</p>
        <p style="margin:0;font-size:13px;color:#888;">⏱ Refunds typically appear within <strong style="color:#ccc;">5–10 business days</strong> depending on your bank.</p>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="color:#888;font-size:12px;margin:0 0 4px;">Booking reference</p>
          <p style="margin:0;font-family:monospace;font-size:16px;font-weight:700;color:#FF6B35;letter-spacing:2px;">${params.bookingRef}</p>
        </div>
      </div>
      <p style="color:#aaa;font-size:15px;">We hope to help you find your perfect room soon. There are plenty of other great options waiting for you!</p>
      <a href="${baseUrl}/housing" style="display:inline-block;background:#FF6B35;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:16px 0;">Browse other rooms →</a>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin-top:24px;">
        <p style="color:#555;font-size:12px;margin:0;">Questions or concerns? Contact our support team at <a href="mailto:info@erasmusvibe.com" style="color:#FF6B35;">info@erasmusvibe.com</a></p>
      </div>
    </div>
  `

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
  to:               string
  guestName:        string
  roomTitle:        string
  neighborhood:     string
  partnerName:      string
  partnerWhatsapp:  string
  partnerEmail:     string
  partnerPhone:     string
  partnerContactName: string
  moveInDate:       string
  duration:         string
  bookingRef:       string
}

export async function sendRoomContactEmail(params: RoomContactEmailParams) {
  const from = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'
  const waNumber = params.partnerWhatsapp.replace(/[^0-9]/g, '')
  const waMessage = encodeURIComponent(
    `Hi ${params.partnerContactName || params.partnerName}! I'm ${params.guestName} and I found your room "${params.roomTitle}" on Erasmus Vibe. I'm interested in moving in on ${params.moveInDate}. Is it still available?`,
  )
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : ''

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF6B35;margin:0 0 4px;font-size:28px;">Erasmus Vibe</h1>
      <p style="color:#888;margin:0 0 28px;font-size:13px;">Student Housing Valencia</p>
      <div style="background:rgba(78,205,196,0.1);border:1px solid #4ECDC4;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
        <p style="font-size:32px;margin:0;">✅</p>
        <h2 style="color:#4ECDC4;margin:8px 0;">Contact Unlocked!</h2>
        <p style="color:#aaa;margin:0;font-size:15px;">${params.roomTitle} · ${params.neighborhood}</p>
      </div>
      <p>Hi ${params.guestName},</p>
      <p>Great news! The landlord confirmed your booking for <strong>${params.roomTitle}</strong>. Here are their contact details — reach out now to arrange your viewing!</p>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Landlord contact</p>
        <p style="margin:0 0 10px;font-size:18px;font-weight:700;">${params.partnerName}</p>
        ${params.partnerContactName ? `<p style="margin:0 0 8px;color:#aaa;font-size:14px;">Contact person: ${params.partnerContactName}</p>` : ''}
        ${params.partnerWhatsapp ? `<p style="margin:0 0 8px;font-size:15px;">📱 WhatsApp: <a href="https://wa.me/${params.partnerWhatsapp.replace(/[^0-9]/g, '')}" style="color:#25D366;font-weight:600;">${params.partnerWhatsapp}</a></p>` : ''}
        ${params.partnerEmail ? `<p style="margin:0 0 8px;font-size:15px;">✉️ Email: <a href="mailto:${params.partnerEmail}" style="color:#4ECDC4;font-weight:600;">${params.partnerEmail}</a></p>` : ''}
        ${params.partnerPhone ? `<p style="margin:0;font-size:15px;">📞 Phone: <strong>${params.partnerPhone}</strong></p>` : ''}
      </div>
      ${waLink ? `<a href="${waLink}" style="display:block;background:#25D366;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:24px;">💬 Message on WhatsApp</a>` : ''}
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 12px;font-weight:600;">What happens next?</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">1️⃣ Contact the landlord on WhatsApp or email</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">2️⃣ Schedule a viewing at a convenient time</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ccc;">3️⃣ Sign the rental contract</p>
        <p style="margin:0;font-size:14px;color:#ccc;">4️⃣ Pay rent + deposit directly to the landlord</p>
      </div>
      <p style="color:#888;font-size:13px;">Move-in date: <strong style="color:#ccc;">${params.moveInDate}</strong> · Duration: <strong style="color:#ccc;">${params.duration} month(s)</strong></p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin:24px 0;">
        <p style="color:#888;margin:0;font-size:13px;">ℹ️ <strong style="color:#aaa;">Please note:</strong> Monthly rent and deposit are paid <strong>directly to the landlord</strong>, not through Erasmus Vibe. The €50 booking fee you paid covers our platform service only.</p>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin-top:8px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Booking reference: <strong style="font-family:monospace;color:#FF6B35;letter-spacing:1px;">${params.bookingRef}</strong></p>
        <p style="color:#555;font-size:12px;margin:4px 0 0;">Questions? Contact us at <a href="mailto:info@erasmusvibe.com" style="color:#FF6B35;">info@erasmusvibe.com</a></p>
      </div>
    </div>
  `

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
  const from = process.env.RESEND_FROM_EMAIL ?? 'bookings@erasmusvibe.com'

  const html = `
    <div style="font-family:Inter,sans-serif;background:#1A1A2E;color:#fff;padding:40px;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF6B35;margin:0 0 24px;">Erasmus Vibe</h1>
      <div style="background:rgba(245,166,35,0.1);border:1px solid #F5A623;border-radius:12px;padding:24px;margin:0 0 24px;">
        <h2 style="color:#F5A623;margin:0 0 6px;">New Room Enquiry</h2>
        <p style="color:#888;margin:0;">Room: ${params.roomTitle}</p>
      </div>
      <p>Hi ${params.partnerName},</p>
      <p>A student has purchased your contact details via Erasmus Vibe and will be reaching out soon. Here are their details:</p>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 12px;">Student details</p>
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;">${params.guestName}</p>
        ${params.guestEmail ? `<p style="margin:0 0 6px;">✉️ ${params.guestEmail}</p>` : ''}
        ${params.guestPhone ? `<p style="margin:0 0 6px;">📱 ${params.guestPhone}</p>` : ''}
        ${params.guestNationality ? `<p style="margin:0 0 6px;">🌍 ${params.guestNationality}</p>` : ''}
        ${params.university ? `<p style="margin:0;">🏫 ${params.university}</p>` : ''}
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:13px;margin:0 0 8px;">Move-in details</p>
        <p style="margin:0 0 4px;">Move-in: <strong>${params.moveInDate}</strong></p>
        <p style="margin:0;">Duration: <strong>${params.duration} month(s)</strong></p>
      </div>
      ${params.message ? `<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin:24px 0;"><p style="color:#888;font-size:13px;margin:0 0 8px;">Their message</p><p style="margin:0;font-style:italic;color:#ccc;">"${params.message}"</p></div>` : ''}
      <p style="color:#888;font-size:13px;margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">Powered by Erasmus Vibe · @erasmus_vibe</p>
    </div>
  `

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
