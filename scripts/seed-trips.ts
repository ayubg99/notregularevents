import { createClient } from '@supabase/supabase-js'
import type { Database, TripInsert } from '../src/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const PICKUP = 'Plaça de l\'Ajuntament, Valencia (in front of the Town Hall steps)'

const trips: TripInsert[] = [
  // ── 1. Ibiza Weekend ──────────────────────────────────────────
  {
    title:           'Ibiza Weekend Getaway',
    slug:            'ibiza-weekend-getaway',
    description:     'Two nights in the White Isle — the ultimate Erasmus bucket-list trip. We take a morning ferry from Dénia, check into a shared villa in San Antonio, and spend the weekend between the crystal-clear waters of Cala Conta, the old town of Dalt Vila, and one proper night out at a world-class club. VIP ticket holders get priority entry and a reserved table. Numbers are strictly capped at 45 — this one sells out fast every summer.',
    category:        'weekend',
    destination:     'Ibiza, Spain',
    start_date:      '2026-06-12T07:00:00+02:00',
    end_date:        '2026-06-14T22:00:00+02:00',
    price_early_bird: 89,
    price_standard:  109,
    price_vip:       149,
    price_group:     99,
    capacity:        45,
    seats_sold:      0,
    image_url:       null,
    status:          'published',
    created_by:      null,
    itinerary: [
      {
        day: 1,
        title: 'Travel & Arrival',
        description: 'Coach from Valencia to Dénia port at 07:00. Morning ferry to Ibiza Town. Check-in to villa in San Antonio. Afternoon free — swim at Cala Gracioneta. Pre-drinks and group dinner in San Antonio.',
      },
      {
        day: 2,
        title: 'Beach & Party',
        description: 'Morning at Cala Conta (one of Ibiza\'s best beaches). Optional sunset at Café del Mar. Night out — club entry included (venue confirmed closer to date).',
      },
      {
        day: 3,
        title: 'Dalt Vila & Return',
        description: 'Morning walk through the UNESCO-listed old town of Dalt Vila. Lunch on the harbour. Afternoon ferry back to Dénia. Coach arrives Valencia ~22:00.',
      },
    ],
    whats_included: [
      'Return coach Valencia ↔ Dénia',
      'Return ferry Dénia ↔ Ibiza',
      '2 nights shared villa accommodation',
      'Welcome drink on arrival',
      'Club entry (1 night)',
      'Erasmus Vibe guide throughout',
    ],
    whats_excluded: [
      'Travel insurance',
      'Personal spending & meals',
      'Optional activities',
      'Drinks beyond welcome drink',
    ],
    meeting_points: [
      PICKUP,
      'Dénia Ferry Terminal, Estació Marítima, Dénia (coach drop-off)',
    ],
    whatsapp_group_url: null,
  },

  // ── 2. Barcelona Day Trip ─────────────────────────────────────
  {
    title:           'Barcelona Day Trip',
    slug:            'barcelona-day-trip',
    description:     'A full day in the Catalan capital, only 3.5 hours from Valencia by coach. We drop you off near the Gothic Quarter with a curated map and a suggested morning route through La Boqueria, Barri Gòtic, and the seafront. Afternoon is completely free — Sagrada Família, Gaudí\'s Park Güell, Barceloneta beach, or a wander through El Born are all easy from the drop-off point. Coach home departs at 20:30, back in Valencia by midnight.',
    category:        'day-trip',
    destination:     'Barcelona, Spain',
    start_date:      '2026-06-27T06:30:00+02:00',
    end_date:        '2026-06-27T23:59:00+02:00',
    price_early_bird: 28,
    price_standard:  38,
    price_vip:       52,
    price_group:     33,
    capacity:        55,
    seats_sold:      0,
    image_url:       null,
    status:          'published',
    created_by:      null,
    itinerary: [
      {
        day: 1,
        title: 'Barcelona Full Day',
        description: 'Depart Valencia 06:30. Arrive Barcelona Gothic Quarter ~10:00. Free exploration all day — La Boqueria, Barri Gòtic, Barceloneta beach, Park Güell, Sagrada Família. Group meet-back at Passeig de Gràcia 20:15. Depart 20:30, arrive Valencia ~midnight.',
      },
    ],
    whats_included: [
      'Return luxury coach Valencia ↔ Barcelona',
      'Curated neighbourhood map & tips',
      'Erasmus Vibe guide on coach',
    ],
    whats_excluded: [
      'Entrance fees to attractions (Sagrada Família, Park Güell, etc.)',
      'Meals and drinks',
      'Travel insurance',
    ],
    meeting_points: [
      PICKUP,
    ],
    whatsapp_group_url: null,
  },

  // ── 3. Montanejos Natural Pools ───────────────────────────────
  {
    title:           'Montanejos Natural Pools',
    slug:            'montanejos-natural-pools',
    description:     'Just 90 minutes inland from Valencia, the turquoise thermal waters of Fuente de los Baños in Montanejos are one of inland Spain\'s best-kept secrets. The natural pool stays at a constant 25°C year-round, fed by a mountain spring loaded with minerals. We spend the morning cliff-jumping and swimming, grab lunch at a local restaurant, and do an optional hike through the Mijares river gorge in the afternoon. One of the best-value day trips we run — always a crowd favourite.',
    category:        'nature',
    destination:     'Montanejos, Castellón',
    start_date:      '2026-07-11T08:30:00+02:00',
    end_date:        '2026-07-11T20:30:00+02:00',
    price_early_bird: 18,
    price_standard:  25,
    price_vip:       35,
    price_group:     22,
    capacity:        50,
    seats_sold:      0,
    image_url:       null,
    status:          'published',
    created_by:      null,
    itinerary: [
      {
        day: 1,
        title: 'Montanejos Full Day',
        description: 'Depart Valencia 08:30. Arrive Fuente de los Baños ~10:00 — swim, cliff-jump, and relax in the 25°C thermal spring. Lunch at Restaurante Río (set menu, included for VIP; own cost for standard). Afternoon optional hike through the Mijares gorge. Depart 18:00, back in Valencia ~20:30.',
      },
    ],
    whats_included: [
      'Return coach Valencia ↔ Montanejos',
      'Cliff-jumping guide & safety briefing',
      'Set lunch at Restaurante Río (VIP only)',
      'Erasmus Vibe guide throughout',
    ],
    whats_excluded: [
      'Lunch for standard/early-bird tickets (~€12 own cost)',
      'Travel insurance',
      'Personal spending',
    ],
    meeting_points: [
      PICKUP,
    ],
    whatsapp_group_url: null,
  },

  // ── 4. Morocco Adventure ──────────────────────────────────────
  {
    title:           'Morocco Adventure — Chefchaouen & Fès',
    slug:            'morocco-adventure-chefchaouen-fes',
    description:     'Five days crossing into North Africa — this is the trip that defines an Erasmus year. We fly from Valencia to Tangier, travel overland through the Blue City of Chefchaouen (one of the most photogenic places on earth), and spend two full days in the ancient medina of Fès, a UNESCO World Heritage site. The trip combines guided medina walks, camel trekking, rooftop dinners in the souks, and enough free time to wander and get wonderfully lost. VIP guests stay in a private riad room with breakfast included each morning.',
    category:        'adventure',
    destination:     'Chefchaouen & Fès, Morocco',
    start_date:      '2026-07-23T05:00:00+02:00',
    end_date:        '2026-07-27T23:00:00+02:00',
    price_early_bird: 249,
    price_standard:  299,
    price_vip:       399,
    price_group:     275,
    capacity:        35,
    seats_sold:      0,
    image_url:       null,
    status:          'published',
    created_by:      null,
    itinerary: [
      {
        day: 1,
        title: 'Valencia → Tangier → Chefchaouen',
        description: 'Early transfer to Valencia Airport. Flight to Tangier Ibn Battouta. Private minibus to Chefchaouen (2.5 hrs). Check into riad. Evening walk through the blue medina and welcome dinner.',
      },
      {
        day: 2,
        title: 'Chefchaouen',
        description: 'Morning guided walk through the blue-washed streets, Ras El Maa waterfall, and the kasbah. Afternoon free for photography, shopping, and hammam. Rooftop sunset dinner.',
      },
      {
        day: 3,
        title: 'Travel to Fès',
        description: 'Morning drive to Fès (3.5 hrs). Check into riad in the medina. Afternoon orientation walk with local guide. Evening: traditional Moroccan cooking class.',
      },
      {
        day: 4,
        title: 'Fès Medina & Optional Camel Trek',
        description: 'Full-day guided tour of Fès el-Bali — tanneries, madrasa Bou Inania, souks. Optional afternoon camel trek outside the city walls. Group dinner in a souk restaurant.',
      },
      {
        day: 5,
        title: 'Return to Valencia',
        description: 'Morning free in Fès. Minibus to Tangier airport. Flight back to Valencia. Arrive ~23:00.',
      },
    ],
    whats_included: [
      'Return flights Valencia ↔ Tangier',
      'All ground transport (private minibuses)',
      '4 nights riad accommodation (shared twin/triple; VIP = private room)',
      'Daily breakfast',
      'Welcome dinner night 1',
      'Local guides in Chefchaouen and Fès',
      'Cooking class (day 3)',
      'Erasmus Vibe group leader throughout',
    ],
    whats_excluded: [
      'Travel insurance (mandatory)',
      'Lunch and dinner (except where noted)',
      'Optional camel trek (€15)',
      'Hammam (€8–12)',
      'Personal shopping',
      'Moroccan entry visa (EU passports: free)',
    ],
    meeting_points: [
      'Valencia Airport (VLC) — Terminal A departures, 05:00',
      PICKUP + ' (free shuttle to airport departs 03:45 — book in advance)',
    ],
    whatsapp_group_url: null,
  },

  // ── 5. Alicante Beach Trip ────────────────────────────────────
  {
    title:           'Alicante Beach Day',
    slug:            'alicante-beach-day',
    description:     'Alicante\'s Postiguet Beach sits right in the city centre, with the Santa Bárbara Castle looming on the cliffs above — making it one of the most scenic urban beaches in Spain. We arrive mid-morning, claim a stretch of sand, and spend the day swimming, playing beach games, and exploring the old town. In the afternoon we take the free lift up to the castle for panoramic views over the Costa Blanca. Coach back after a group paella dinner on the Explanada promenade. Easy, fun, and one of the most photogenic days of your Erasmus.',
    category:        'beach',
    destination:     'Alicante, Spain',
    start_date:      '2026-08-08T08:00:00+02:00',
    end_date:        '2026-08-08T23:00:00+02:00',
    price_early_bird: 19,
    price_standard:  28,
    price_vip:       39,
    price_group:     24,
    capacity:        60,
    seats_sold:      0,
    image_url:       null,
    status:          'published',
    created_by:      null,
    itinerary: [
      {
        day: 1,
        title: 'Alicante Full Day',
        description: 'Depart Valencia 08:00. Arrive Playa del Postiguet ~10:00 — beach games, swimming, sunbathing. Early afternoon: free time in Alicante old town (El Barrio). Castle Santa Bárbara visit (~16:00, free lift). Group paella dinner on the Explanada (~19:30, included for VIP; own cost ~€14 for others). Depart 21:30, arrive Valencia ~23:00.',
      },
    ],
    whats_included: [
      'Return luxury coach Valencia ↔ Alicante',
      'Beach games kit (volleyball, frisbee, bat & ball)',
      'Group paella dinner on the Explanada (VIP only)',
      'Erasmus Vibe guide throughout',
    ],
    whats_excluded: [
      'Dinner for standard/early-bird tickets (~€14 own cost)',
      'Entrance to any paid attractions',
      'Travel insurance',
      'Personal spending',
    ],
    meeting_points: [
      PICKUP,
    ],
    whatsapp_group_url: null,
  },
]

async function seed() {
  console.log(`Inserting ${trips.length} trips…`)

  const { data, error } = await supabase
    .from('trips')
    .insert(trips)
    .select('id, title, destination, price_standard')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log('Inserted:')
  data?.forEach(t =>
    console.log(`  ✓ ${t.title}  →  ${t.destination}  (€${t.price_standard} standard)`),
  )
  console.log('Done.')
}

seed()
