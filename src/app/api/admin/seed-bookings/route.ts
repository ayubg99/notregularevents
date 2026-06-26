import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ref  = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const ago  = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const qrEv = (r: string) => QRCode.toDataURL(`EV-${r}`, { width: 200, margin: 1 })

export async function POST() {
  const supabase = getAdminClient()

  // ── Resolve event IDs by slug ─────────────────────────────────
  const { data: events } = await supabase.from('events').select('id, slug')
  const eventId = (slug: string) => events?.find(e => e.slug === slug)?.id ?? null

  // ── Resolve user IDs by email ─────────────────────────────────
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const userId = (email: string) =>
    authUsers?.users?.find(u => u.email === email)?.id ?? null

  // ── 1. Event tickets ──────────────────────────────────────────

  type EvTicket = {
    slug: string; guestName: string; email: string
    tierName: string; amount: number
    checkedIn: boolean; daysAgo: number
  }

  const eventTickets: EvTicket[] = [
    // International Monday — Akuarela
    { slug: 'international-monday-akuarela', guestName: 'Sofia Müller',    email: 'sofia.mueller@student.de',        tierName: 'Free Entry',   amount: 0.00,   checkedIn: true,  daysAgo: 1 },
    { slug: 'international-monday-akuarela', guestName: 'Marco Rossi',     email: 'marco.rossi@univr.it',            tierName: 'Guestlist',    amount: 5.00,   checkedIn: true,  daysAgo: 1 },
    { slug: 'international-monday-akuarela', guestName: 'Emma Dupont',     email: 'emma.dupont@univ-paris.fr',       tierName: 'Guestlist',    amount: 5.00,   checkedIn: true,  daysAgo: 1 },
    { slug: 'international-monday-akuarela', guestName: 'Lucas Silva',     email: 'lucas.silva@uc.pt',               tierName: 'VIP Table',    amount: 200.00, checkedIn: false, daysAgo: 1 },
    { slug: 'international-monday-akuarela', guestName: 'Anna Kowalski',   email: 'anna.kowalski@uw.edu.pl',         tierName: 'Guestlist',    amount: 5.00,   checkedIn: false, daysAgo: 1 },
    { slug: 'international-monday-akuarela', guestName: 'Jan Novák',       email: 'jan.novak@cvut.cz',               tierName: 'Door Price',   amount: 15.00,  checkedIn: true,  daysAgo: 1 },
    // Beer Pong — Beracay
    { slug: 'beerpong-tuesday-beracay',      guestName: 'Lukas Bauer',     email: 'lukas.bauer@tum.de',              tierName: 'Beer Pong Team', amount: 16.00, checkedIn: true,  daysAgo: 2 },
    { slug: 'beerpong-tuesday-beracay',      guestName: 'Filip Horvat',    email: 'filip.horvat@unizg.hr',           tierName: 'Free Entry',   amount: 0.00,   checkedIn: true,  daysAgo: 2 },
    { slug: 'beerpong-tuesday-beracay',      guestName: 'Elena Papadaki',  email: 'elena.papadaki@uoa.gr',           tierName: 'Beer Pong Team', amount: 24.00, checkedIn: true,  daysAgo: 2 },
    // Red Party
    { slug: 'red-party-open-bar',            guestName: 'Camille Bernard', email: 'camille.bernard@sciences-po.fr',  tierName: 'Open Bar',     amount: 5.00,   checkedIn: false, daysAgo: 3 },
    { slug: 'red-party-open-bar',            guestName: 'Sofia Müller',    email: 'sofia.mueller@student.de',        tierName: 'Open Bar',     amount: 5.00,   checkedIn: false, daysAgo: 3 },
    { slug: 'red-party-open-bar',            guestName: 'Marco Rossi',     email: 'marco.rossi@univr.it',            tierName: 'Dress in Red', amount: 5.00,   checkedIn: false, daysAgo: 3 },
    // Bachata Workshop
    { slug: 'bachata-workshop-night',        guestName: 'Anna Kowalski',   email: 'anna.kowalski@uw.edu.pl',         tierName: 'Guestlist',    amount: 12.00,  checkedIn: false, daysAgo: 4 },
    { slug: 'bachata-workshop-night',        guestName: 'Elena Papadaki',  email: 'elena.papadaki@uoa.gr',           tierName: 'Guestlist',    amount: 12.00,  checkedIn: false, daysAgo: 4 },
    { slug: 'bachata-workshop-night',        guestName: 'Lucas Silva',     email: 'lucas.silva@uc.pt',               tierName: 'Guestlist',    amount: 8.00,   checkedIn: false, daysAgo: 4 },
    // Espit Chupitos Night
    { slug: 'espit-chupitos-night',          guestName: 'Jan Novák',       email: 'jan.novak@cvut.cz',               tierName: 'Shot Package', amount: 15.00,  checkedIn: false, daysAgo: 2 },
    { slug: 'espit-chupitos-night',          guestName: 'Filip Horvat',    email: 'filip.horvat@unizg.hr',           tierName: 'Guestlist',    amount: 5.00,   checkedIn: false, daysAgo: 2 },
    { slug: 'espit-chupitos-night',          guestName: 'Lukas Bauer',     email: 'lukas.bauer@tum.de',              tierName: 'Shot Package', amount: 15.00,  checkedIn: false, daysAgo: 2 },
    // Closing Night
    { slug: 'international-monday-closing',  guestName: 'Emma Dupont',     email: 'emma.dupont@univ-paris.fr',       tierName: 'Free Entry',   amount: 0.00,   checkedIn: false, daysAgo: 5 },
    { slug: 'international-monday-closing',  guestName: 'Camille Bernard', email: 'camille.bernard@sciences-po.fr',  tierName: 'Free Entry',   amount: 0.00,   checkedIn: false, daysAgo: 5 },
    { slug: 'international-monday-closing',  guestName: 'Marco Rossi',     email: 'marco.rossi@univr.it',            tierName: 'Guestlist',    amount: 5.00,   checkedIn: false, daysAgo: 5 },
  ]

  for (const t of eventTickets) {
    const evId = eventId(t.slug)
    if (!evId) continue
    const bookingRef = ref()
    const qrCode = await qrEv(bookingRef)
    const { error } = await supabase.from('event_tickets').insert({
      event_id:         evId,
      user_id:          userId(t.email),
      guest_name:       t.guestName,
      guest_email:      t.email,
      booking_ref:      bookingRef,
      qr_code:          qrCode,
      ticket_tier_name: t.tierName,
      amount_paid:      t.amount,
      status:           t.checkedIn ? 'used' : 'active',
      checked_in:       t.checkedIn,
      checked_in_at:    t.checkedIn ? ago(0) : null,
      created_at:       ago(t.daysAgo),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    if (error) return NextResponse.json({ error: `ticket ${t.guestName}/${t.slug}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    event_tickets: eventTickets.length,
  })
}
