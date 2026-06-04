export function emailLayout(content: string, baseUrl: string, footerNote?: string): string {
  const footer = footerNote ??
    `Erasmus Life Valencia — your international community<br />Questions? Reply to this email or visit <a href="${baseUrl}" style="color:#FF6B00;">${baseUrl.replace('https://','')}</a>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF8EE;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FF6B00;">
    <tr>
      <td align="center" style="padding:28px 24px;">
        <img src="${baseUrl}/logo.png" alt="Erasmus Life" height="52" style="display:block;" />
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:40px 24px 0;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;border-top:1px solid rgba(255,248,238,0.06);">
        <p style="margin:0;font-size:12px;color:#B8A090;text-align:center;line-height:1.7;">
          ${footer}
        </p>
      </td>
    </tr>
  </table>

</body>
</html>`
}
