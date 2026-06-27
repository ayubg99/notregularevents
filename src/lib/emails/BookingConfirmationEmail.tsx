interface Props {
  name:      string
  bookingRef: string
  title:     string
  date?:     string
  location?: string
  baseUrl:   string
  isFree?:   boolean
}

export function BookingConfirmationEmail({
  name, bookingRef, title, date, location, baseUrl, isFree,
}: Props): string {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Booking Confirmed — Not Regular Events</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'JetBrains Mono',Arial,monospace;color:#FFF8EE;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FF6B00;">
    <tr>
      <td align="center" style="padding:28px 24px;">
        <img src="${baseUrl}/nre-logo.png" alt="Not Regular Events" height="52" style="display:block;" />
      </td>
    </tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:40px 24px 0;">

        <!-- Greeting -->
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
          Hey ${name} 👋
        </p>
        <p style="margin:0 0 ${isFree ? '16' : '32'}px;font-size:15px;color:#B8A090;line-height:1.6;">
          ${isFree ? "You're registered! See you there 🎉" : 'Your event booking is confirmed. See you there!'}
        </p>
        ${isFree ? '<p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#2ECC71;">FREE EVENT ✓</p>' : ''}

        <!-- Booking ref card -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
                Booking Reference
              </p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:32px;font-weight:700;
                        letter-spacing:0.15em;color:#FF6B00;">
                ${bookingRef}
              </p>
            </td>
          </tr>
        </table>

        <!-- QR code -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
          <tr>
            <td align="center" style="padding:28px 24px;">
              <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
                Show this at the door
              </p>
              <img src="cid:qr-code" alt="QR Code" width="180" height="180"
                   style="display:block;border-radius:12px;background:#fff;padding:8px;" />
            </td>
          </tr>
        </table>

        <!-- Event details -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:32px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
                Event
              </p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#FFF8EE;">${title}</p>

              ${formattedDate ? `
              <p style="margin:0 0 8px;font-size:14px;color:#B8A090;">
                📅 &nbsp;${formattedDate}
              </p>` : ''}

              ${location ? `
              <p style="margin:0;font-size:14px;color:#B8A090;">
                📍 &nbsp;${location}
              </p>` : ''}
            </td>
          </tr>
        </table>

        <!-- CTAs -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <a href="${baseUrl}/booking/success?ref=${bookingRef}"
                 style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                        font-size:14px;text-decoration:none;padding:14px 32px;border-radius:9999px;">
                View Booking Online →
              </a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${baseUrl}/auth/register"
                 style="display:inline-block;border:1px solid rgba(255,248,238,0.18);color:#FFF8EE;
                        font-weight:600;font-size:14px;text-decoration:none;padding:13px 32px;
                        border-radius:9999px;">
                Create Account to Manage Bookings
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:32px 24px;border-top:1px solid rgba(255,248,238,0.06);margin-top:32px;">
        <p style="margin:0;font-size:12px;color:#B8A090;text-align:center;line-height:1.7;">
          Not Regular Events • Madrid<br />
          Questions? Reply to this email or visit <a href="${baseUrl}" style="color:#FF6B00;">${baseUrl.replace('https://','')}</a>
        </p>
      </td>
    </tr>
  </table>

</body>
</html>`
}
