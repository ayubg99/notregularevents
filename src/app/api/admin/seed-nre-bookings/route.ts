import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ref = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString()

const GUESTS = [
  { name: 'Lucas Fernández',   email: 'lucas.fernandez@ucm.es',          nationality: 'Spain'   },
  { name: 'Sophie Wagner',     email: 'sophie.wagner@fu-berlin.de',       nationality: 'Germany' },
  { name: 'Marco Ricci',       email: 'marco.ricci@polimi.it',            nationality: 'Italy'   },
  { name: 'Camille Laurent',   email: 'camille.laurent@sciencespo.fr',    nationality: 'France'  },
  { name: 'Filip Novak',       email: 'filip.novak@cvut.cz',              nationality: 'Czech Republic' },
  { name: 'Emma van der Berg', email: 'emma.vdberg@uva.nl',               nationality: 'Netherlands' },
  { name: 'Aleksandra Kowal',  email: 'a.kowal@uw.edu.pl',               nationality: 'Poland'  },
  { name: 'Diego Martínez',    email: 'diego.martinez@uam.es',            nationality: 'Spain'   },
  { name: 'Nikoleta Papadaki', email: 'n.papadaki@uoa.gr',               nationality: 'Greece'  },
  { name: 'João Silva',        email: 'joao.silva@tecnico.ulisboa.pt',    nationality: 'Portugal'},
  { name: 'Ingrid Svensson',   email: 'i.svensson@su.se',                nationality: 'Sweden'  },
  { name: 'Andrei Popescu',    email: 'andrei.popescu@unibuc.ro',         nationality: 'Romania' },
  { name: 'Beatriz Gómez',     email: 'beatriz.gomez@upm.es',             nationality: 'Spain'   },
  { name: 'Luca Bauer',        email: 'luca.bauer@tuwien.ac.at',          nationality: 'Austria' },
  { name: 'Nadia Dumont',      email: 'nadia.dumont@ulb.ac.be',           nationality: 'Belgium' },
  { name: 'Tomáš Krejčí',      email: 'tomas.krejci@muni.cz',            nationality: 'Czech Republic' },
  { name: 'Valentina Esposito',email: 'valentina.esposito@uniroma1.it',   nationality: 'Italy'   },
  { name: 'Anton Müller',      email: 'anton.mueller@lmu.de',             nationality: 'Germany' },
  { name: 'Sarah O\'Brien',    email: 'sarah.obrien@ucd.ie',              nationality: 'Ireland' },
  { name: 'Rafael Torres',     email: 'rafael.torres@uc3m.es',            nationality: 'Spain'   },
]

function pickGuests(indices: number[]) {
  return indices.map(i => GUESTS[i % GUESTS.length])
}

export async function POST() {
  const supabase = getAdminClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, slug, title, price, ticket_tiers, status')
    .eq('status', 'published')

  if (!events?.length) {
    return NextResponse.json({ error: 'No published events found — seed events first.' }, { status: 400 })
  }

  let totalTickets = 0

  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tiers = (event.ticket_tiers as any[]) ?? []
    const defaultPrice = (event.price as number) ?? 10

    // Build 4-8 realistic bookings per event spread across the last 30 days
    const spread = [1, 3, 5, 8, 12, 17, 22, 28]
    const guestPicks = pickGuests([
      (events.indexOf(event) * 3) % 20,
      (events.indexOf(event) * 3 + 1) % 20,
      (events.indexOf(event) * 3 + 2) % 20,
      (events.indexOf(event) * 3 + 4) % 20,
      (events.indexOf(event) * 7) % 20,
      (events.indexOf(event) * 7 + 1) % 20,
    ])

    for (let i = 0; i < guestPicks.length; i++) {
      const guest     = guestPicks[i]
      const daysAgo   = spread[i % spread.length]
      const tier      = tiers[i % Math.max(tiers.length, 1)]
      const tierName  = tier?.name ?? 'Guestlist'
      const tierPrice = tier?.price ?? defaultPrice
      const checkedIn = daysAgo <= 2 && i % 3 !== 0
      const bookingRef = ref()

      const qrCode = await QRCode.toDataURL(`EV-${bookingRef}`, { width: 200, margin: 1 })

      const { error } = await supabase.from('event_tickets').insert({
        event_id:         event.id,
        user_id:          null,
        guest_name:       guest.name,
        guest_email:      guest.email,
        booking_ref:      bookingRef,
        qr_code:          qrCode,
        ticket_tier_name: tierName,
        amount_paid:      tierPrice,
        status:           checkedIn ? 'used' : 'active',
        checked_in:       checkedIn,
        checked_in_at:    checkedIn ? ago(0) : null,
        created_at:       ago(daysAgo, i * 2),
        stripe_payment_id: tierPrice > 0 ? `pi_seed_${bookingRef.toLowerCase()}` : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      if (error) {
        return NextResponse.json({
          error: `ticket for ${guest.name} / ${event.slug}: ${error.message}`,
        }, { status: 500 })
      }

      // Also update the event's tickets_sold count
      await supabase
        .from('events')
        .update({ tickets_sold: (event as { tickets_sold?: number }).tickets_sold ?? 0 })
        .eq('id', event.id)

      totalTickets++
    }
  }

  return NextResponse.json({ ok: true, events: events.length, tickets_created: totalTickets })
}
