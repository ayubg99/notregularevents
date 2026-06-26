import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STUDENTS = [
  { email: 'sofia.mueller@student.de',       full_name: 'Sofia Müller',    nationality: 'German',     university: 'Ludwig Maximilian University Munich',  bio: 'Erasmus student from Munich studying Business. Love hiking and trying local food!' },
  { email: 'marco.rossi@univr.it',           full_name: 'Marco Rossi',     nationality: 'Italian',    university: 'University of Verona',                 bio: 'Architecture student from Verona. Passionate about design, photography and good espresso.' },
  { email: 'emma.dupont@univ-paris.fr',      full_name: 'Emma Dupont',     nationality: 'French',     university: 'Sciences Po Paris',                    bio: 'Political science student from Paris. Here for the beaches and the paella!' },
  { email: 'lucas.silva@uc.pt',              full_name: 'Lucas Silva',     nationality: 'Portuguese', university: 'University of Coimbra',                bio: 'Engineering student from Coimbra. Football lover and beach volleyball player.' },
  { email: 'anna.kowalski@uw.edu.pl',        full_name: 'Anna Kowalski',   nationality: 'Polish',     university: 'University of Warsaw',                 bio: 'Psychology student from Warsaw. Love dancing, languages and meeting new people.' },
  { email: 'jan.novak@cvut.cz',              full_name: 'Jan Novák',       nationality: 'Czech',      university: 'Czech Technical University Prague',    bio: 'Computer science student from Prague. Cyclist, hiker and coffee enthusiast.' },
  { email: 'elena.papadaki@uoa.gr',          full_name: 'Elena Papadaki',  nationality: 'Greek',      university: 'University of Athens',                 bio: 'Law student from Athens. Love the Mediterranean lifestyle — Valencia feels like home!' },
  { email: 'lukas.bauer@tum.de',             full_name: 'Lukas Bauer',     nationality: 'German',     university: 'Technical University of Munich',       bio: 'Mechanical engineering student. Here to study, travel and make friends from everywhere.' },
  { email: 'camille.bernard@sciences-po.fr', full_name: 'Camille Bernard', nationality: 'French',     university: 'Sciences Po Paris',                   bio: 'International relations student. Passionate about culture, travel and languages.' },
  { email: 'filip.horvat@unizg.hr',          full_name: 'Filip Horvat',    nationality: 'Croatian',   university: 'University of Zagreb',                bio: 'Economics student from Zagreb. Beach lover, traveller and Erasmus enthusiast.' },
]

// 6 students get memberships: plan maps to basic/premium/vip
const MEMBERSHIPS: Record<string, { plan: 'basic' | 'premium' | 'vip'; months: number }> = {
  'sofia.mueller@student.de':       { plan: 'premium', months: 5  },
  'marco.rossi@univr.it':           { plan: 'basic',   months: 1  },
  'emma.dupont@univ-paris.fr':      { plan: 'vip',     months: 11 },
  'anna.kowalski@uw.edu.pl':        { plan: 'premium', months: 4  },
  'lukas.bauer@tum.de':             { plan: 'basic',   months: 1  },
  'camille.bernard@sciences-po.fr': { plan: 'premium', months: 6  },
}

const EVENT_BOOKINGS = [
  { slug: 'international-monday-akuarela', email: 'sofia.mueller@student.de',       name: 'Sofia Müller',    amount_paid: 5  },
  { slug: 'international-monday-akuarela', email: 'marco.rossi@univr.it',           name: 'Marco Rossi',     amount_paid: 5  },
  { slug: 'international-monday-akuarela', email: 'emma.dupont@univ-paris.fr',      name: 'Emma Dupont',     amount_paid: 0  },
  { slug: 'beerpong-tuesday-beracay',      email: 'anna.kowalski@uw.edu.pl',        name: 'Anna Kowalski',   amount_paid: 8  },
  { slug: 'beerpong-tuesday-beracay',      email: 'lukas.bauer@tum.de',             name: 'Lukas Bauer',     amount_paid: 8  },
  { slug: 'bachata-workshop-night',        email: 'camille.bernard@sciences-po.fr', name: 'Camille Bernard', amount_paid: 12 },
  { slug: 'espit-chupitos-night',          email: 'filip.horvat@unizg.hr',          name: 'Filip Horvat',    amount_paid: 5  },
  { slug: 'espit-chupitos-night',          email: 'elena.papadaki@uoa.gr',          name: 'Elena Papadaki',  amount_paid: 5  },
  { slug: 'espit-chupitos-night',          email: 'lucas.silva@uc.pt',              name: 'Lucas Silva',     amount_paid: 15 },
  { slug: 'red-party-open-bar',            email: 'jan.novak@cvut.cz',              name: 'Jan Novák',       amount_paid: 5  },
]

const TRIP_BOOKINGS = [
  { slug: 'morocco-adventure-9-days',   email: 'sofia.mueller@student.de',       name: 'Sofia Müller',    amount_paid: 249, tier: 'early_bird' as const },
  { slug: 'morocco-adventure-9-days',   email: 'emma.dupont@univ-paris.fr',      name: 'Emma Dupont',     amount_paid: 299, tier: 'standard'   as const },
  { slug: 'ibiza-weekend-getaway',      email: 'marco.rossi@univr.it',           name: 'Marco Rossi',     amount_paid: 129, tier: 'early_bird' as const },
  { slug: 'ibiza-weekend-getaway',      email: 'anna.kowalski@uw.edu.pl',        name: 'Anna Kowalski',   amount_paid: 159, tier: 'standard'   as const },
  { slug: 'ibiza-weekend-getaway',      email: 'camille.bernard@sciences-po.fr', name: 'Camille Bernard', amount_paid: 129, tier: 'early_bird' as const },
  { slug: 'albufera-sunset-tour',       email: 'lukas.bauer@tum.de',             name: 'Lukas Bauer',     amount_paid: 25,  tier: 'early_bird' as const },
  { slug: 'albufera-sunset-tour',       email: 'elena.papadaki@uoa.gr',          name: 'Elena Papadaki',  amount_paid: 35,  tier: 'standard'   as const },
  { slug: 'cala-moraig-hiking-beach',   email: 'lucas.silva@uc.pt',              name: 'Lucas Silva',     amount_paid: 18,  tier: 'early_bird' as const },
  { slug: 'cala-moraig-hiking-beach',   email: 'filip.horvat@unizg.hr',          name: 'Filip Horvat',    amount_paid: 25,  tier: 'standard'   as const },
  { slug: 'montanejos-natural-pools',   email: 'jan.novak@cvut.cz',              name: 'Jan Novák',       amount_paid: 16,  tier: 'early_bird' as const },
]

function randomRef() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function POST() {
  const supabase = getAdminClient()

  // ── 1. Create auth users ──────────────────────────────────────
  const userIds: Record<string, string> = {}

  for (const s of STUDENTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: s.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: s.full_name },
    })
    if (error && !error.message.includes('already been registered')) {
      return NextResponse.json({ error: `create user ${s.email}: ${error.message}` }, { status: 500 })
    }
    if (data?.user) userIds[s.email] = data.user.id
  }

  // Fetch IDs for any users that already existed
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  for (const u of existingUsers?.users ?? []) {
    if (!userIds[u.email!] && STUDENTS.some(s => s.email === u.email)) {
      userIds[u.email!] = u.id
    }
  }

  // ── 2. Update profiles (trigger auto-creates them) ───────────
  for (const s of STUDENTS) {
    const uid = userIds[s.email]
    if (!uid) continue
    await supabase.from('profiles').update({
      nationality: s.nationality,
      university:  s.university,
      bio:         s.bio,
    }).eq('user_id', uid)
  }

  // ── 3. Memberships ────────────────────────────────────────────
  for (const [email, m] of Object.entries(MEMBERSHIPS)) {
    const uid = userIds[email]
    if (!uid) continue
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + m.months)
    await supabase.from('memberships').upsert({
      user_id:    uid,
      plan:       m.plan,
      status:     'active',
      start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      end_date:   endDate.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, { onConflict: 'user_id' })
  }

  // ── 4. Event bookings ─────────────────────────────────────────
  const { data: events } = await supabase.from('events').select('id, slug')
  const eventMap: Record<string, string> = {}
  for (const e of events ?? []) eventMap[e.slug] = e.id

  for (const b of EVENT_BOOKINGS) {
    const eventId = eventMap[b.slug]
    if (!eventId) continue
    await supabase.from('event_tickets').insert({
      event_id:    eventId,
      user_id:     userIds[b.email] ?? null,
      guest_name:  b.name,
      guest_email: b.email,
      booking_ref: randomRef(),
      status:      'active',
      amount_paid: b.amount_paid,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  // ── 5. Trip bookings ──────────────────────────────────────────
  const { data: trips } = await supabase.from('trips').select('id, slug')
  const tripMap: Record<string, string> = {}
  for (const t of trips ?? []) tripMap[t.slug] = t.id

  for (const b of TRIP_BOOKINGS) {
    const tripId = tripMap[b.slug]
    if (!tripId) continue
    await supabase.from('trip_bookings').insert({
      trip_id:     tripId,
      user_id:     userIds[b.email] ?? null,
      guest_name:  b.name,
      guest_email: b.email,
      tier:        b.tier,
      booking_ref: randomRef(),
      status:      'confirmed',
      deposit_paid: true,
      amount_paid: b.amount_paid,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  return NextResponse.json({
    ok: true,
    users_created: Object.keys(userIds).length,
    memberships: Object.keys(MEMBERSHIPS).length,
    event_bookings: EVENT_BOOKINGS.length,
    trip_bookings: TRIP_BOOKINGS.length,
  })
}
