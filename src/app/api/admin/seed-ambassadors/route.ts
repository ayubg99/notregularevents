import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const d = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString()

const future = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString()

export async function POST() {
  const supabase = getAdminClient()

  // ── 1. Create auth users ──────────────────────────────────────

  const users = [
    { email: 'sofia.ambassador@student.de',       full_name: 'Sofia Müller'    },
    { email: 'marco.ambassador@univr.it',          full_name: 'Marco Rossi'     },
    { email: 'camille.ambassador@sciences-po.fr',  full_name: 'Camille Bernard' },
    { email: 'lukas.ambassador@tum.de',            full_name: 'Lukas Bauer'     },
    { email: 'anna.ambassador@uw.edu.pl',          full_name: 'Anna Kowalski'   },
  ]

  const userIds: Record<string, string> = {}

  for (const u of users) {
    // Check if already exists
    const { data: existing } = await supabase.auth.admin.listUsers()
    const found = existing?.users?.find(x => x.email === u.email)

    if (found) {
      userIds[u.email] = found.id
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email:            u.email,
        password:         'Password123!',
        email_confirm:    true,
        user_metadata:    { full_name: u.full_name },
      })
      if (error) return NextResponse.json({ error: `user ${u.email}: ${error.message}` }, { status: 500 })
      userIds[u.email] = data.user.id
    }
  }

  // ── 2. Profiles ───────────────────────────────────────────────

  const profiles = [
    { email: 'sofia.ambassador@student.de',      full_name: 'Sofia Müller',    nationality: 'German',  university: 'LMU Munich',           bio: 'Erasmus student and Erasmus Life ambassador. Loves Valencia nightlife and beach life.' },
    { email: 'marco.ambassador@univr.it',         full_name: 'Marco Rossi',     nationality: 'Italian', university: 'University of Verona',  bio: 'Erasmus Life ambassador — loves Valencia and helping other students discover the city.' },
    { email: 'camille.ambassador@sciences-po.fr', full_name: 'Camille Bernard', nationality: 'French',  university: 'Sciences Po Paris',     bio: 'Top Erasmus Life ambassador. Event organiser and social connector. Always at every event.' },
    { email: 'lukas.ambassador@tum.de',           full_name: 'Lukas Bauer',     nationality: 'German',  university: 'TU Munich',             bio: 'Tech student and Erasmus Life ambassador. Loves hiking trips and beach parties.' },
    { email: 'anna.ambassador@uw.edu.pl',         full_name: 'Anna Kowalski',   nationality: 'Polish',  university: 'University of Warsaw',  bio: 'Newest Erasmus Life community ambassador. Making friends across all Valencia universities.' },
  ]

  for (const p of profiles) {
    const uid = userIds[p.email]
    await supabase.from('profiles').upsert({
      user_id: uid,
      full_name: p.full_name, nationality: p.nationality,
      university: p.university, bio: p.bio,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('users').upsert({ id: uid, full_name: p.full_name, role: 'ambassador' } as any)
  }

  // ── 3. Memberships ────────────────────────────────────────────

  for (const u of users) {
    const uid = userIds[u.email]
    await supabase.from('memberships').upsert({
      user_id:    uid,
      plan:       'vip',
      status:     'active',
      start_date: d(60),
      end_date:   future(300),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  // ── 4. Ambassador records ─────────────────────────────────────

  type AmbData = {
    email: string; referral_code: string; commission_rate: number
    total_referrals: number; total_earnings: number
    pending_earnings: number; paid_earnings: number
  }

  const ambassadorData: AmbData[] = [
    { email: 'sofia.ambassador@student.de',      referral_code: 'SOFI8234', commission_rate: 5, total_referrals: 47, total_earnings: 187.50, pending_earnings: 43.75,  paid_earnings: 143.75 },
    { email: 'marco.ambassador@univr.it',         referral_code: 'MARC5621', commission_rate: 5, total_referrals: 23, total_earnings: 92.00,  pending_earnings: 27.50,  paid_earnings: 64.50  },
    { email: 'camille.ambassador@sciences-po.fr', referral_code: 'CAMI3891', commission_rate: 8, total_referrals: 61, total_earnings: 312.40, pending_earnings: 67.20,  paid_earnings: 245.20 },
    { email: 'lukas.ambassador@tum.de',           referral_code: 'LUKA7412', commission_rate: 5, total_referrals: 12, total_earnings: 48.75,  pending_earnings: 21.25,  paid_earnings: 27.50  },
    { email: 'anna.ambassador@uw.edu.pl',         referral_code: 'ANNA2956', commission_rate: 5, total_referrals: 8,  total_earnings: 32.00,  pending_earnings: 32.00,  paid_earnings: 0      },
  ]

  const ambassadorIds: Record<string, string> = {}

  for (const a of ambassadorData) {
    const uid = userIds[a.email]
    // Delete existing to avoid duplicate referral_code
    await supabase.from('ambassadors').delete().eq('user_id', uid)

    const { data, error } = await supabase.from('ambassadors').insert({
      user_id:          uid,
      referral_code:    a.referral_code,
      commission_rate:  a.commission_rate,
      total_referrals:  a.total_referrals,
      total_earnings:   a.total_earnings,
      pending_earnings: a.pending_earnings,
      paid_earnings:    a.paid_earnings,
      status:           'active',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select('id').single()

    if (error) return NextResponse.json({ error: `ambassador ${a.email}: ${error.message}` }, { status: 500 })
    ambassadorIds[a.email] = data.id
  }

  // ── 5. Commission history ─────────────────────────────────────

  type Commission = { type: 'event'|'trip'; title: string; amount: number; earned: number; status: 'paid'|'pending'; daysAgo: number }

  const commissions: Record<string, Commission[]> = {
    'sofia.ambassador@student.de': [
      { type: 'event', title: 'International Monday — Akuarela', amount: 5.00,   earned: 0.25,  status: 'paid',    daysAgo: 14 },
      { type: 'trip',  title: 'Morocco Adventure 9 Days',        amount: 299.00, earned: 14.95, status: 'paid',    daysAgo: 13 },
      { type: 'event', title: 'Red Party Open Bar',               amount: 5.00,   earned: 0.25,  status: 'paid',    daysAgo: 12 },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',            amount: 159.00, earned: 7.95,  status: 'paid',    daysAgo: 11 },
      { type: 'event', title: 'Beer Pong Tournament',             amount: 8.00,   earned: 0.40,  status: 'paid',    daysAgo: 10 },
      { type: 'trip',  title: 'Cala Moraig Hiking',               amount: 25.00,  earned: 1.25,  status: 'paid',    daysAgo: 9  },
      { type: 'trip',  title: 'Morocco Adventure 9 Days',         amount: 249.00, earned: 12.45, status: 'paid',    daysAgo: 8  },
      { type: 'event', title: 'Espit Chupitos Night',             amount: 15.00,  earned: 0.75,  status: 'paid',    daysAgo: 7  },
      { type: 'trip',  title: 'Albufera Sunset Tour',             amount: 35.00,  earned: 1.75,  status: 'paid',    daysAgo: 6  },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',            amount: 129.00, earned: 6.45,  status: 'pending', daysAgo: 5  },
      { type: 'event', title: 'Bachata Workshop Night',           amount: 12.00,  earned: 0.60,  status: 'pending', daysAgo: 4  },
      { type: 'trip',  title: 'Morocco Adventure 9 Days',         amount: 299.00, earned: 14.95, status: 'pending', daysAgo: 3  },
      { type: 'event', title: 'International Monday',             amount: 5.00,   earned: 0.25,  status: 'pending', daysAgo: 2  },
      { type: 'trip',  title: 'Tabarca Island Boat Day',          amount: 45.00,  earned: 2.25,  status: 'pending', daysAgo: 1  },
    ],
    'camille.ambassador@sciences-po.fr': [
      { type: 'trip',  title: 'Morocco Adventure 9 Days',  amount: 299.00, earned: 23.92, status: 'paid',    daysAgo: 20 },
      { type: 'trip',  title: 'Morocco Adventure 9 Days',  amount: 249.00, earned: 19.92, status: 'paid',    daysAgo: 18 },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 159.00, earned: 12.72, status: 'paid',    daysAgo: 16 },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 129.00, earned: 10.32, status: 'paid',    daysAgo: 14 },
      { type: 'event', title: 'International Monday',      amount: 5.00,   earned: 0.40,  status: 'paid',    daysAgo: 12 },
      { type: 'trip',  title: 'Tabarca Island Boat Day',   amount: 45.00,  earned: 3.60,  status: 'paid',    daysAgo: 10 },
      { type: 'trip',  title: 'Albufera Sunset Tour',      amount: 35.00,  earned: 2.80,  status: 'paid',    daysAgo: 8  },
      { type: 'event', title: 'Red Party Open Bar',        amount: 5.00,   earned: 0.40,  status: 'paid',    daysAgo: 6  },
      { type: 'trip',  title: 'Morocco Adventure 9 Days',  amount: 299.00, earned: 23.92, status: 'pending', daysAgo: 5  },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 159.00, earned: 12.72, status: 'pending', daysAgo: 3  },
      { type: 'event', title: 'Espit Chupitos Night',      amount: 15.00,  earned: 1.20,  status: 'pending', daysAgo: 2  },
      { type: 'trip',  title: 'Cala Moraig Hiking',        amount: 18.00,  earned: 1.44,  status: 'pending', daysAgo: 1  },
    ],
    'marco.ambassador@univr.it': [
      { type: 'trip',  title: 'Morocco Adventure 9 Days',  amount: 299.00, earned: 14.95, status: 'paid',    daysAgo: 15 },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 159.00, earned: 7.95,  status: 'paid',    daysAgo: 12 },
      { type: 'event', title: 'Beer Pong Tournament',      amount: 8.00,   earned: 0.40,  status: 'paid',    daysAgo: 9  },
      { type: 'trip',  title: 'Albufera Sunset Tour',      amount: 25.00,  earned: 1.25,  status: 'paid',    daysAgo: 7  },
      { type: 'event', title: 'International Monday',      amount: 5.00,   earned: 0.25,  status: 'paid',    daysAgo: 5  },
      { type: 'trip',  title: 'Cala Moraig Hiking',        amount: 18.00,  earned: 0.90,  status: 'pending', daysAgo: 3  },
      { type: 'event', title: 'Espit Chupitos Night',      amount: 5.00,   earned: 0.25,  status: 'pending', daysAgo: 2  },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 129.00, earned: 6.45,  status: 'pending', daysAgo: 1  },
    ],
    'lukas.ambassador@tum.de': [
      { type: 'trip',  title: 'Ibiza Weekend Getaway',  amount: 159.00, earned: 7.95, status: 'paid',    daysAgo: 10 },
      { type: 'event', title: 'International Monday',   amount: 5.00,   earned: 0.25, status: 'paid',    daysAgo: 8  },
      { type: 'trip',  title: 'Albufera Sunset Tour',   amount: 35.00,  earned: 1.75, status: 'paid',    daysAgo: 6  },
      { type: 'event', title: 'Red Party Open Bar',     amount: 5.00,   earned: 0.25, status: 'paid',    daysAgo: 4  },
      { type: 'trip',  title: 'Cala Moraig Hiking',     amount: 25.00,  earned: 1.25, status: 'pending', daysAgo: 2  },
      { type: 'event', title: 'Espit Chupitos Night',   amount: 15.00,  earned: 0.75, status: 'pending', daysAgo: 1  },
    ],
    'anna.ambassador@uw.edu.pl': [
      { type: 'trip',  title: 'Morocco Adventure 9 Days',  amount: 299.00, earned: 14.95, status: 'pending', daysAgo: 5 },
      { type: 'event', title: 'International Monday',      amount: 5.00,   earned: 0.25,  status: 'pending', daysAgo: 4 },
      { type: 'trip',  title: 'Ibiza Weekend Getaway',     amount: 129.00, earned: 6.45,  status: 'pending', daysAgo: 3 },
      { type: 'event', title: 'Beer Pong Tournament',      amount: 8.00,   earned: 0.40,  status: 'pending', daysAgo: 2 },
      { type: 'event', title: 'Espit Chupitos Night',      amount: 5.00,   earned: 0.25,  status: 'pending', daysAgo: 1 },
    ],
  }

  for (const [email, list] of Object.entries(commissions)) {
    const ambassadorId = ambassadorIds[email]
    const rate = ambassadorData.find(a => a.email === email)!.commission_rate
    const rows = list.map(c => ({
      ambassador_id:     ambassadorId,
      booking_type:      c.type,
      booking_ref:       Math.random().toString(36).slice(2, 10).toUpperCase(),
      event_title:       c.title,
      amount_paid:       c.amount,
      commission_rate:   rate,
      commission_earned: c.earned,
      status:            c.status,
      created_at:        d(c.daysAgo),
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('ambassador_commissions').insert(rows as any)
    if (error) return NextResponse.json({ error: `commissions ${email}: ${error.message}` }, { status: 500 })
  }

  // ── 6. Rewards ────────────────────────────────────────────────

  type Reward = { type: 'free_ticket'|'membership_upgrade'|'cash_bonus'; desc: string; value: number; status: 'claimed'|'pending'; expiresInDays?: number }

  const rewards: Record<string, Reward[]> = {
    'sofia.ambassador@student.de': [
      { type: 'cash_bonus',          desc: '€50 cash bonus — 25 referrals reached!',   value: 50.00, status: 'claimed' },
      { type: 'membership_upgrade',  desc: 'Free membership upgrade — 10 referrals!',  value: 9.99,  status: 'claimed' },
      { type: 'free_ticket',         desc: 'Free event ticket — 5 referrals!',          value: 1.00,  status: 'claimed' },
    ],
    'camille.ambassador@sciences-po.fr': [
      { type: 'cash_bonus',         desc: '€150 cash bonus — 50 referrals reached!',  value: 150.00, status: 'claimed' },
      { type: 'cash_bonus',         desc: '€50 cash bonus — 25 referrals reached!',   value: 50.00,  status: 'claimed' },
      { type: 'membership_upgrade', desc: 'Free membership upgrade — 10 referrals!',  value: 9.99,   status: 'claimed' },
      { type: 'free_ticket',        desc: 'Free event ticket — 5 referrals!',          value: 1.00,   status: 'claimed' },
    ],
    'marco.ambassador@univr.it': [
      { type: 'membership_upgrade', desc: 'Free membership upgrade — 10 referrals!',  value: 9.99, status: 'claimed' },
      { type: 'free_ticket',        desc: 'Free event ticket — 5 referrals!',          value: 1.00, status: 'claimed' },
    ],
    'lukas.ambassador@tum.de': [
      { type: 'free_ticket', desc: 'Free event ticket — 5 referrals!', value: 1.00, status: 'claimed' },
    ],
    'anna.ambassador@uw.edu.pl': [
      { type: 'free_ticket', desc: 'Free event ticket — 5 referrals!', value: 1.00, status: 'pending', expiresInDays: 30 },
    ],
  }

  for (const [email, list] of Object.entries(rewards)) {
    const ambassadorId = ambassadorIds[email]
    const rows = list.map(r => ({
      ambassador_id: ambassadorId,
      reward_type:   r.type,
      description:   r.desc,
      value:         r.value,
      status:        r.status,
      expires_at:    r.expiresInDays ? future(r.expiresInDays) : null,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('ambassador_rewards').insert(rows as any)
    if (error) return NextResponse.json({ error: `rewards ${email}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    ambassadors: ambassadorData.length,
    commissions: Object.values(commissions).flat().length,
    rewards: Object.values(rewards).flat().length,
  })
}
