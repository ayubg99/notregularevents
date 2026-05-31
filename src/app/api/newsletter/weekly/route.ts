import { NextRequest, NextResponse } from 'next/server'
import { runWeeklyDigest } from '@/lib/newsletter'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeeklyDigest()
    console.log('[cron/newsletter] digest result:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/newsletter] failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
