interface Props {
  jobTitle:  string
  company:   string
  viewUrl:   string
  manageUrl: string
  editUrl:   string
}

export function JobManagementEmail({ jobTitle, company, viewUrl, manageUrl, editUrl }: Props): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Manage your job listing</title>
</head>
<body style="margin:0;padding:0;background:#1A1209;font-family:Inter,Arial,sans-serif;color:#FFF8EE;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5A623;">
    <tr>
      <td align="center" style="padding:24px;">
        <p style="margin:0;font-size:18px;font-weight:800;color:#1A1209;letter-spacing:-0.5px;">
          Erasmus Vibe Jobs
        </p>
      </td>
    </tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:40px 24px 0;">

        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#FFF8EE;">
          Your job listing is live! 💼
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#B8A090;line-height:1.6;">
          Bookmark this email — it contains your private management link.
        </p>

        <!-- Job details -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#221608;border:1px solid rgba(255,248,238,0.09);border-radius:16px;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#FFF8EE;">${jobTitle}</p>
              <p style="margin:0;font-size:14px;color:#B8A090;">${company}</p>
            </td>
          </tr>
        </table>

        <!-- Primary CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <a href="${manageUrl}"
                 style="display:inline-block;background:#F5A623;color:#1A1209;font-weight:700;
                        font-size:15px;text-decoration:none;padding:14px 36px;border-radius:9999px;">
                Manage My Listing →
              </a>
            </td>
          </tr>
        </table>

        <!-- Secondary links -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td align="center" style="padding-top:12px;">
              <a href="${editUrl}" style="color:#F5A623;font-size:13px;text-decoration:none;margin-right:24px;">
                ✏️ Edit listing
              </a>
              <a href="${viewUrl}" style="color:#B8A090;font-size:13px;text-decoration:none;">
                👁️ View listing
              </a>
            </td>
          </tr>
        </table>

        <!-- Security note -->
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

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:24px;border-top:1px solid rgba(255,248,238,0.06);">
        <p style="margin:0;font-size:12px;color:#B8A090;text-align:center;line-height:1.7;">
          Erasmus Vibe Valencia — jobs for internationals<br />
          Questions? Email <a href="mailto:support@erasmusvibe.com" style="color:#F5A623;">support@erasmusvibe.com</a>
        </p>
      </td>
    </tr>
  </table>

</body>
</html>`
}
