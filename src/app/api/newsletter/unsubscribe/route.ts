import { NextRequest } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new Response(unsubscribePage('Invalid link', 'This unsubscribe link is missing a token.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('newsletter_emails')
    .delete()
    .eq('unsubscribe_token', token)

  if (error) {
    console.error('[newsletter] unsubscribe error:', error)
    return new Response(unsubscribePage('Something went wrong', 'Please try again or contact us at info@erasmusvibe.com.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new Response(unsubscribePage('Unsubscribed', "You've been removed from the Erasmus Vibe newsletter. No more emails from us!"), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubscribePage(title: string, message: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — Erasmus Vibe</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF8EE;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;text-align:center;">
    <img src="${baseUrl}/logo.png" alt="Erasmus Vibe" height="48" style="display:block;margin:0 auto 32px;" />
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FFF8EE;">${title}</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#B8A090;line-height:1.6;">${message}</p>
    <a href="${baseUrl}" style="display:inline-block;background:#FF6B00;color:#0D0D0D;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:9999px;">
      Back to Erasmus Vibe
    </a>
  </div>
</body>
</html>`
}
