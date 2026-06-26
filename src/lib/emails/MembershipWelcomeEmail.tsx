interface Props {
  name:    string
  plan:    'basic' | 'premium' | 'vip' | 'employer'
  endDate: string
  baseUrl: string
}

const PLAN_INFO = {
  basic:    { label: 'Monthly',  price: '€9.99/mo',  duration: '30 days'  },
  premium:  { label: 'Semester', price: '≈€4.17/mo', duration: '6 months' },
  vip:      { label: 'Annual',   price: '≈€3.33/mo', duration: '1 year'   },
  employer: { label: 'Partner',  price: '€49/mo',    duration: '1 month'  },
}

export function MembershipWelcomeEmail({ name, plan, endDate, baseUrl }: Props): string {
  const info = PLAN_INFO[plan]
  const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Not Regular Events Membership</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Space Grotesk',Arial,sans-serif;color:#FFF8EE;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FF6B00;">
    <tr>
      <td align="center" style="padding:28px 24px;">
        <img src="${baseUrl}/logo.png" alt="Not Regular Events" height="52" style="display:block;" />
      </td>
    </tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:40px 24px 0;">

        <!-- Greeting -->
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
          Welcome, ${name}! 🎉
        </p>
        <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
          You're now a Vibe Member — enjoy your discount on every event and trip.
        </p>

        <!-- Membership details -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
                Membership Details
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#B8A090;">Plan</td>
                  <td style="padding:6px 0;font-size:14px;color:#FFF8EE;text-align:right;font-weight:600;">
                    ${info.label}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#B8A090;">Price</td>
                  <td style="padding:6px 0;font-size:14px;color:#FFF8EE;text-align:right;">
                    ${info.price}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#B8A090;">Duration</td>
                  <td style="padding:6px 0;font-size:14px;color:#FFF8EE;text-align:right;">
                    ${info.duration}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#B8A090;">Valid Until</td>
                  <td style="padding:6px 0;font-size:14px;color:#FFF8EE;text-align:right;">
                    ${formattedEnd}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#B8A090;">Status</td>
                  <td style="padding:6px 0;text-align:right;">
                    <span style="background:#2ECC71;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Benefits -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:32px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">
                Your Member Benefits
              </p>
              <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">🎟️ &nbsp;10% discount on all events</p>
              <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">✈️ &nbsp;10% discount on all trips</p>
              <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">⚡ &nbsp;Priority access to new events</p>
              <p style="margin:0 0 10px;font-size:14px;color:#FFF8EE;">💬 &nbsp;Private WhatsApp member groups</p>
              <p style="margin:0;font-size:14px;color:#FFF8EE;">🎉 &nbsp;Exclusive members-only parties</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <a href="${baseUrl}/events"
                 style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                        font-size:14px;text-decoration:none;padding:14px 32px;border-radius:9999px;">
                Browse Events with Discount →
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
