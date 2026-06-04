import { emailLayout } from './emailLayout'

interface Props {
  jobTitle:  string
  company:   string
  viewUrl:   string
  manageUrl: string
  editUrl:   string
  baseUrl:   string
}

export function JobManagementEmail({ jobTitle, company, viewUrl, manageUrl, editUrl, baseUrl }: Props): string {
  const content = `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#FFF8EE;">
      Your job listing is live! 💼
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">
      Bookmark this email — it contains your private management link.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#FFF8EE;">${jobTitle}</p>
          <p style="margin:0;font-size:14px;color:#B8A090;">${company}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${manageUrl}"
             style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;
                    font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">
            Manage My Listing →
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td align="center" style="padding-top:12px;">
          <a href="${editUrl}" style="color:#FF6B00;font-size:13px;text-decoration:none;margin-right:24px;">
            ✏️ Edit listing
          </a>
          <a href="${viewUrl}" style="color:#B8A090;font-size:13px;text-decoration:none;">
            👁️ View listing
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#221608;border:1px solid rgba(255,248,238,0.06);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:12px;color:#B8A090;line-height:1.6;">
            🔒 <strong style="color:#FFF8EE;">Keep this link private.</strong>
            Anyone with this link can edit or delete your listing.
            If you lose it, contact us at support@erasmusvibe.com.
          </p>
        </td>
      </tr>
    </table>
  `

  return emailLayout(
    content,
    baseUrl,
    `Erasmus Vibe Valencia — jobs for internationals<br />Questions? Email <a href="mailto:support@erasmusvibe.com" style="color:#FF6B00;">support@erasmusvibe.com</a>`,
  )
}
