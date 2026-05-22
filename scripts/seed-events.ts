import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'
import type { EventInsert } from '../src/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const events: EventInsert[] = [
  // ── Party ────────────────────────────────────────────────────
  {
    title:       'Erasmus Night at Akuarela Beach Club',
    slug:        'erasmus-night-akuarela-beach-club',
    description: 'Kick off the weekend at one of Valencia\'s most iconic beach clubs. Akuarela sits right on the sand at Playa de la Malvarrosa — two floors, a rooftop terrace, and a lineup of resident DJs spinning commercial house and reggaeton until 4 AM. Your ticket includes a welcome drink. Dress code: smart casual. Doors open at midnight.',
    category:    'party',
    date:        '2026-06-06T23:00:00+02:00',
    location:    'Akuarela Beach Club, Paseo Neptuno 2, Playa de la Malvarrosa, Valencia',
    image_url:   null,
    price:       18,
    capacity:    150,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },
  {
    title:       'Rooftop Closing Party — Umbracle Terraza',
    slug:        'rooftop-closing-party-umbracle-terraza',
    description: 'The Umbracle Terraza is one of the most spectacular outdoor venues in Europe — a glass-roofed garden perched on top of Valencia\'s Arts & Sciences complex. Join 150 Erasmus students for a summer closing party with a live DJ set, cocktail bar, and views over the City of Arts and Sciences. Tickets sell out every edition — grab yours early.',
    category:    'party',
    date:        '2026-06-20T22:30:00+02:00',
    location:    'Umbracle Terraza, Paseo de la Alameda 12, Ciudad de las Artes y las Ciencias, Valencia',
    image_url:   null,
    price:       22,
    capacity:    150,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },

  // ── Beach ────────────────────────────────────────────────────
  {
    title:       'Beach Day at La Malvarrosa',
    slug:        'beach-day-la-malvarrosa',
    description: 'A full Saturday on Valencia\'s most popular urban beach. We claim a stretch of sand at 11 AM, set up games (volleyball, padel tennis, frisbee), and spend the day swimming, socialising, and soaking up the Valencian sun. The day finishes with a group paella dinner at a nearby chiringuito — included in the ticket price. Sunscreen not included, good vibes are.',
    category:    'other',
    date:        '2026-06-13T11:00:00+02:00',
    location:    'Playa de la Malvarrosa, Paseo Marítimo de la Malvarrosa, Valencia',
    image_url:   null,
    price:       12,
    capacity:    80,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },
  {
    title:       'Sunset Kayak & Swim at Playa de El Saler',
    slug:        'sunset-kayak-swim-playa-el-saler',
    description: 'Escape the city and discover Playa de El Saler — a wilder, less crowded beach inside the Albufera Natural Park, just 20 minutes south of Valencia. We organise a group kayak session along the shoreline, followed by a free swim and a sunset barbecue on the beach. Transport by coach from Plaça de l\'Ajuntament is included. Maximum 60 participants.',
    category:    'other',
    date:        '2026-07-04T17:00:00+02:00',
    location:    'Playa de El Saler, Albufera Natural Park, Valencia',
    image_url:   null,
    price:       20,
    capacity:    60,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },

  // ── Networking ───────────────────────────────────────────────
  {
    title:       'Erasmus Connections — Networking Mixer',
    slug:        'erasmus-connections-networking-mixer',
    description: 'Whether you\'re looking for internship leads, travel partners, or just want to build your international network, this structured mixer is the place to be. Hosted at Ubik Café in the Ruzafa neighbourhood, the evening runs speed-networking rounds followed by free mingling. Bring business cards or a LinkedIn QR code. Ticket includes two drinks and tapas.',
    category:    'networking',
    date:        '2026-06-25T19:00:00+02:00',
    location:    'Ubik Café, Carrer de Literato Azorín 13, Ruzafa, Valencia',
    image_url:   null,
    price:       14,
    capacity:    50,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },

  // ── Sport ────────────────────────────────────────────────────
  {
    title:       'Erasmus Futsal Tournament — Polideportivo Petxina',
    slug:        'erasmus-futsal-tournament-polideportivo-petxina',
    description: 'Form a team of 5 or register alone and we\'ll place you — all levels welcome. The tournament runs across two indoor pitches at Polideportivo Municipal Petxina, one of Valencia\'s best public sports facilities. Group stage in the morning, knockout rounds after lunch. Medals for the top three teams. Bring your own boots; bibs provided. Entry fee covers a post-match drinks social at a nearby bar.',
    category:    'sport',
    date:        '2026-07-11T09:30:00+02:00',
    location:    'Polideportivo Municipal Petxina, Carrer de Beato Nicolás Factor 1, Valencia',
    image_url:   null,
    price:       10,
    capacity:    100,
    tickets_sold: 0,
    status:      'published',
    created_by:  null,
  },
]

async function seed() {
  console.log(`Inserting ${events.length} events…`)

  const { data, error } = await supabase
    .from('events')
    .insert(events)
    .select('id, title, category')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log('Inserted:')
  data?.forEach(e => console.log(`  ✓ [${e.category}] ${e.title}`))
  console.log('Done.')
}

seed()
