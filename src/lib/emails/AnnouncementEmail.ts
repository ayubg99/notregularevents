import { emailLayout } from './emailLayout'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

interface NewEventProps {
  title:          string
  slug:           string
  date:           string
  location:       string | null
  price:          number | null
  isFree:         boolean
  imageUrl:       string | null
  baseUrl:        string
  unsubscribeUrl: string
}

interface NewTripProps {
  title:          string
  slug:           string
  startDate:      string
  endDate:        string | null
  destination:    string | null
  priceStandard:  number | null
  imageUrl:       string | null
  baseUrl:        string
  unsubscribeUrl: string
}

export function NewEventAnnouncementEmail(p: NewEventProps): string {
  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#F5A623;">
      New Event Just Dropped 🎉
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#B8A090;line-height:1.6;">
      A new event has been added — grab your spot before it sells out.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:28px;">
      ${p.imageUrl ? `
      <tr>
        <td style="padding:0;line-height:0;">
          <img src="${p.imageUrl}" width="100%" alt="${p.title}"
               style="display:block;width:100%;height:200px;object-fit:cover;border-radius:16px 16px 0 0;" />
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Event</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#FFF8EE;">${p.title}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#B8A090;">📅 &nbsp;${fmt(p.date)}</p>
          ${p.location ? `<p style="margin:0 0 4px;font-size:14px;color:#B8A090;">📍 &nbsp;${p.location}</p>` : ''}
          <p style="margin:0 0 20px;font-size:14px;color:#B8A090;">
            🎟️ &nbsp;${p.isFree ? 'Free entry' : p.price ? `From €${p.price} &nbsp;·&nbsp; Members −10%` : ''}
          </p>
          <a href="${p.baseUrl}/events/${p.slug}"
             style="display:inline-block;background:#F5A623;color:#1A1209;font-weight:700;
                    font-size:14px;text-decoration:none;padding:12px 28px;border-radius:9999px;">
            Book Now →
          </a>
        </td>
      </tr>
    </table>
  `

  return emailLayout(
    content,
    p.baseUrl,
    `Erasmus Vibe Valencia — your international community<br /><a href="${p.unsubscribeUrl}" style="color:#B8A090;font-size:11px;">Unsubscribe from newsletter</a>`,
  )
}

export function NewTripAnnouncementEmail(p: NewTripProps): string {
  const dateRange = p.endDate
    ? `${fmt(p.startDate)} – ${fmt(p.endDate)}`
    : fmt(p.startDate)

  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#FF6B35;">
      New Trip Just Added ✈️
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#B8A090;line-height:1.6;">
      A new trip has been announced — spots fill up fast.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:28px;">
      ${p.imageUrl ? `
      <tr>
        <td style="padding:0;line-height:0;">
          <img src="${p.imageUrl}" width="100%" alt="${p.title}"
               style="display:block;width:100%;height:200px;object-fit:cover;border-radius:16px 16px 0 0;" />
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#B8A090;">Trip</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#FFF8EE;">${p.title}</p>
          ${p.destination ? `<p style="margin:0 0 4px;font-size:14px;color:#B8A090;">✈️ &nbsp;${p.destination}</p>` : ''}
          <p style="margin:0 0 4px;font-size:14px;color:#B8A090;">📅 &nbsp;${dateRange}</p>
          ${p.priceStandard ? `<p style="margin:0 0 20px;font-size:14px;color:#B8A090;">💶 &nbsp;From €${p.priceStandard} &nbsp;·&nbsp; Members −10%</p>` : '<div style="height:20px;"></div>'}
          <a href="${p.baseUrl}/trips/${p.slug}"
             style="display:inline-block;background:#FF6B35;color:#fff;font-weight:700;
                    font-size:14px;text-decoration:none;padding:12px 28px;border-radius:9999px;">
            View Trip →
          </a>
        </td>
      </tr>
    </table>
  `

  return emailLayout(
    content,
    p.baseUrl,
    `Erasmus Vibe Valencia — your international community<br /><a href="${p.unsubscribeUrl}" style="color:#B8A090;font-size:11px;">Unsubscribe from newsletter</a>`,
  )
}
