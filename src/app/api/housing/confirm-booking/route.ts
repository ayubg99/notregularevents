export const runtime ='nodejs'

import { NextRequest, NextResponse } from'next/server'
import { getAdminClient } from'@/lib/supabase/admin'
import { confirmBooking, rejectBooking } from'@/lib/booking-utils'

function html(title: string, color: string, heading: string, body: string) {
  return new NextResponse(
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont,'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #16161f; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; max-width: 480px; width: 100%; padding: 40px 36px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: ${color}; margin-bottom: 12px; }
    p { color: rgba(255,255,255,0.6); line-height: 1.6; font-size: 15px; }
    .ref { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.3); font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    ${heading}
    ${body}
  </div>
</body>
</html>`,
    { headers: {'Content-Type':'text/html; charset=utf-8' } },
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const action = searchParams.get('action')

  if (!ref || (action !=='confirm' && action !=='reject')) {
    return html(
'Invalid request',
'#ef4444',
'<div class="icon"></div><h1>Invalid Request</h1>',
'<p>This link is missing required parameters. Please check the email and try again.</p>',
    )
  }

  const admin = getAdminClient()

  if (action ==='confirm') {
    const result = await confirmBooking(ref, admin)

    if (!result.success) {
      const alreadyHandled = result.error?.startsWith('Already')
      return html(
        alreadyHandled ?'Already handled' :'Error',
        alreadyHandled ?'#f59e0b' :'#ef4444',
`<div class="icon">${alreadyHandled ?'' :''}</div><h1>${alreadyHandled ?'Already Handled' :'Something went wrong'}</h1>`,
`<p>${alreadyHandled ?'This booking has already been confirmed or rejected.' :'We couldn\'t confirm this booking. Please contact support.'}</p><p class="ref">Ref: ${ref}</p>`,
      )
    }

    return html(
'Booking confirmed',
'#22c55e',
'<div class="icon"></div><h1>Booking Confirmed!</h1>',
`<p>You've confirmed this booking. The student has been emailed your contact details and will be in touch soon.</p><p class="ref">Ref: ${ref}</p>`,
    )
  }

  // action ==='reject'
  const reason = searchParams.get('reason') ??'Room no longer available'
  const result = await rejectBooking(ref, reason, admin)

  if (!result.success) {
    const alreadyHandled = result.error?.startsWith('Already')
    return html(
      alreadyHandled ?'Already handled' :'Error',
      alreadyHandled ?'#f59e0b' :'#ef4444',
`<div class="icon">${alreadyHandled ?'' :''}</div><h1>${alreadyHandled ?'Already Handled' :'Something went wrong'}</h1>`,
`<p>${alreadyHandled ?'This booking has already been confirmed or rejected.' :'We couldn\'t process the rejection. Please contact support.'}</p><p class="ref">Ref: ${ref}</p>`,
    )
  }

  return html(
'Booking rejected',
'#f59e0b',
'<div class="icon"></div><h1>Booking Rejected</h1>',
`<p>The booking has been rejected and the student's €50 payment has been fully refunded. The room is now available again.</p><p class="ref">Ref: ${ref}</p>`,
  )
}
