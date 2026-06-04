import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { pin } = await req.json()

  const correctPin = process.env.SCANNER_PIN

  if (!correctPin) {
    console.error('SCANNER_PIN not set in env vars')
    return NextResponse.json({ valid: false, error: 'PIN not configured' })
  }

  return NextResponse.json({ valid: pin === correctPin })
}
