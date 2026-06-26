import { emailLayout } from './emailLayout'

export interface DigestEvent {
  title:     string
  slug:      string
  date:      string
  location:  string | null
  price:     number | null
  is_free:   boolean
  image_url: string | null
}

interface Props {
  events:         DigestEvent[]
  baseUrl:        string
  unsubscribeUrl: string
  weekLabel:      string
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function WeeklyDigestEmail({ events, baseUrl, unsubscribeUrl, weekLabel }: Props): string {
  const eventCards = events.map(e => `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:12px;">
      ${e.image_url ? `
      <tr>
        <td style="padding:0;line-height:0;">
          <img src="${e.image_url}" width="100%" alt="${e.title}"
               style="display:block;width:100%;height:180px;object-fit:cover;border-radius:16px 16px 0 0;" />
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Event</p>
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#FFF8EE;">${e.title}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#B8A090;">📅 &nbsp;${fmt(e.date)}</p>
          ${e.location ? `<p style="margin:0 0 4px;font-size:13px;color:#B8A090;">📍 &nbsp;${e.location}</p>` : ''}
          <p style="margin:0 0 16px;font-size:13px;color:#B8A090;">
            🎟️ &nbsp;${e.is_free ? 'Free entry' : e.price ? `From €${e.price} &nbsp;·&nbsp; Members −10%` : ''}
          </p>
          <a href="${baseUrl}/events/${e.slug}"
             style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                    font-size:13px;text-decoration:none;padding:10px 24px;border-radius:9999px;">
            Book Now →
          </a>
        </td>
      </tr>
    </table>
  `).join('')

  const content = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#FFF8EE;">
      What's on this week 🎉
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      ${weekLabel} — here's everything happening in Valencia.
    </p>

    ${events.length ? `
      <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Events</p>
      ${eventCards}
    ` : ''}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${baseUrl}/events"
             style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                    font-size:14px;text-decoration:none;padding:14px 32px;border-radius:9999px;">
            See All Events →
          </a>
        </td>
      </tr>
    </table>
  `

  return emailLayout(
    content,
    baseUrl,
    `Erasmus Life Valencia — your international community<br /><a href="${unsubscribeUrl}" style="color:#B8A090;font-size:11px;">Unsubscribe from newsletter</a>`,
  )
}
