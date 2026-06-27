import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const now = new Date()
  const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()

  // ── 0. Clear existing data ────────────────────────────────────

  await supabase.from('partner_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('housing_partners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('housing_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // ── 1. Student listings ───────────────────────────────────────

  const listings = [
    {
      type: 'room_available' as const,
      title: 'Sunny private room in Malasaña — bills included',
      description: "Beautiful bright room in a modern flat right in the heart of Malasaña. The room gets incredible morning light and has a big wardrobe. 2 flatmates — one French, one Dutch — both Erasmus students, very social and clean. All bills included: wifi, water, electricity. 5 minutes walk to the best bars and cafés in Madrid.",
      price: 520,
      neighborhood: 'Malasaña',
      room_type: 'private_room' as const,
      available_from: d(3),
      available_until: d(180),
      flatmates_count: 2,
      flatmates_nationalities: ['🇫🇷', '🇳🇱'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Washing machine'],
      contact_name: 'Sofia',
      contact_whatsapp: '+34612345678',
      contact_email: 'sofia.mueller@student.de',
      nationality: 'German',
      university: 'Freie Universität Berlin',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'room_available' as const,
      title: 'Modern furnished studio — Chueca, fully equipped',
      description: 'Stunning modern studio in Chueca, one of the most vibrant neighbourhoods in Madrid. Completely furnished with new furniture, fully equipped kitchen, and a large bathroom. Perfect for someone who wants their own space in the best location. Secure building with intercom. 2-minute walk to metro.',
      price: 780,
      neighborhood: 'Chueca',
      room_type: 'studio' as const,
      available_from: d(7),
      available_until: d(240),
      flatmates_count: 0,
      flatmates_nationalities: [],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Private bathroom', 'Washing machine'],
      contact_name: 'Emma',
      contact_whatsapp: '+34623456789',
      contact_email: 'emma.dupont@univ-paris.fr',
      nationality: 'French',
      university: 'Sciences Po Paris',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'room_available' as const,
      title: 'Large room with private balcony — La Latina',
      description: 'Spacious private room in a classic Madrid flat in La Latina with its own small balcony overlooking a quiet street. The flat has high ceilings, original tiles and a large shared kitchen. 2 flatmates — one Spanish, one Italian. Amazing location — walking distance to the El Rastro market, tapas bars and metro.',
      price: 490,
      neighborhood: 'La Latina',
      room_type: 'private_room' as const,
      available_from: d(10),
      available_until: d(150),
      flatmates_count: 2,
      flatmates_nationalities: ['🇪🇸', '🇮🇹'],
      amenities: ['WiFi', 'AC', 'Furnished', 'Balcony', 'Washing machine'],
      contact_name: 'Marco',
      contact_whatsapp: '+34634567890',
      contact_email: 'marco.rossi@univr.it',
      nationality: 'Italian',
      university: 'University of Bologna',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'room_available' as const,
      title: 'Cosy room in Lavapiés — multicultural flat, great vibe',
      description: "Very cosy private room in Lavapiés, Madrid's most multicultural and artistic neighbourhood. The flat has a lovely common area and a great kitchen. 3 flatmates from different countries — very social and welcoming. Loads of amazing cafés, independent shops and events right outside the door. Best Erasmus neighbourhood in Madrid.",
      price: 390,
      neighborhood: 'Lavapiés',
      room_type: 'private_room' as const,
      available_from: d(5),
      available_until: d(150),
      flatmates_count: 3,
      flatmates_nationalities: ['🇬🇷', '🇧🇷', '🇵🇱'],
      amenities: ['WiFi', 'Furnished', 'Washing machine'],
      contact_name: 'Elena',
      contact_whatsapp: '+34645678901',
      contact_email: 'elena.papadaki@uoa.gr',
      nationality: 'Greek',
      university: 'University of Athens',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'room_available' as const,
      title: 'Student room near Complutense — quiet flat',
      description: 'Private room 10 minutes from Complutense University by metro. The flat is clean, quiet and well organised — perfect for students who need to focus. 2 Spanish flatmates who are students themselves. The room has a proper desk setup for studying. All basic amenities included. Very convenient location with direct metro to Gran Vía.',
      price: 440,
      neighborhood: 'Moncloa',
      room_type: 'private_room' as const,
      available_from: d(14),
      available_until: d(200),
      flatmates_count: 2,
      flatmates_nationalities: ['🇪🇸', '🇪🇸'],
      amenities: ['WiFi', 'AC', 'Furnished', 'Washing machine'],
      contact_name: 'Lucas',
      contact_whatsapp: '+34656789012',
      contact_email: 'lucas.silva@uc.pt',
      nationality: 'Portuguese',
      university: 'University of Lisbon',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'room_available' as const,
      title: 'Bright room in Chamberí — female-only flat',
      description: 'Lovely bright room in a female-only flat in Chamberí, a safe and residential neighbourhood in Madrid. 2 flatmates — one Spanish, one Belgian. The flat is very clean and has a nice living room. Lots of good restaurants and cafés nearby, and excellent public transport. Looking for a female student or professional.',
      price: 530,
      neighborhood: 'Chamberí',
      room_type: 'private_room' as const,
      available_from: d(20),
      available_until: d(180),
      flatmates_count: 2,
      flatmates_nationalities: ['🇪🇸', '🇧🇪'],
      amenities: ['WiFi', 'AC', 'Furnished', 'Washing machine', 'Bills included'],
      contact_name: 'Anna',
      contact_whatsapp: '+34667890123',
      contact_email: 'anna.kowalski@uw.edu.pl',
      nationality: 'Polish',
      university: 'University of Warsaw',
      gender_preference: 'female' as const,
      photos: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'looking_for_room' as const,
      title: 'Erasmus student looking for room — Malasaña or Chueca',
      description: "Hi! I'm Jan from Prague, studying Architecture at UPM Madrid. Looking for a private room from next month for 5 months. Budget €450–550/month including bills. I am tidy, quiet and love cooking. Non-smoker. Would love to live with other international students in a social flat. I speak English, Spanish and Czech.",
      price: 500,
      neighborhood: 'Malasaña',
      room_type: 'private_room' as const,
      available_from: d(4),
      available_until: d(160),
      flatmates_count: 0,
      flatmates_nationalities: [],
      amenities: ['WiFi', 'AC'],
      contact_name: 'Jan',
      contact_whatsapp: '+34678901234',
      contact_email: 'jan.novak@cvut.cz',
      nationality: 'Czech',
      university: 'Czech Technical University Prague',
      gender_preference: 'any' as const,
      photos: [],
      status: 'active' as const,
      expires_at: d(60),
    },
    {
      type: 'looking_for_room' as const,
      title: 'Looking for flatmate — nice flat in La Latina, room available',
      description: "We have a spare room in our flat in La Latina! Looking for a friendly person to join our flat. The flat is 80m², 3 bedrooms, large living room and a nice kitchen. We're 2 students — Spanish and Italian — very social but also respect privacy. The room is furnished and available from the 1st. Rent is €480/month all inclusive.",
      price: 480,
      neighborhood: 'La Latina',
      room_type: 'private_room' as const,
      available_from: d(1),
      available_until: d(120),
      flatmates_count: 2,
      flatmates_nationalities: ['🇪🇸', '🇮🇹'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished'],
      contact_name: 'Carlos',
      contact_whatsapp: '+34689012345',
      contact_email: 'carlos.garcia@ucm.es',
      nationality: 'Spanish',
      university: 'Complutense University Madrid',
      gender_preference: 'any' as const,
      photos: [
        'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      ],
      status: 'active' as const,
      expires_at: d(60),
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: listingsError } = await supabase.from('housing_listings').insert(listings as any)
  if (listingsError) return NextResponse.json({ error: 'listings: ' + listingsError.message }, { status: 500 })

  // ── 2. Housing partners ───────────────────────────────────────

  const partners = [
    {
      name: 'Madrid Student Rooms',
      contact_name: 'Alejandro Torres',
      contact_email: 'alejandro@madridstudentrooms.com',
      contact_phone: '+34913111222',
      whatsapp: '+34633111222',
      description: 'Verified student accommodation across Madrid. Fully furnished rooms and studios in the best student neighbourhoods. All bills included. English-speaking team.',
      logo_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
      status: 'active' as const,
    },
    {
      name: 'Erasmus Housing Madrid',
      contact_name: 'Laura Sánchez',
      contact_email: 'laura@erasmushousingmadrid.com',
      contact_phone: '+34913222333',
      whatsapp: '+34644222333',
      description: 'Specialist Erasmus accommodation in Madrid. Private rooms and shared flats for international students. Flexible contracts from 1 month.',
      logo_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
      status: 'active' as const,
    },
  ]

  const { data: insertedPartners, error: partnersError } = await supabase
    .from('housing_partners')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(partners as any)
    .select('id, name')
  if (partnersError) return NextResponse.json({ error: 'partners: ' + partnersError.message }, { status: 500 })

  const partnerMap: Record<string, string> = {}
  for (const p of insertedPartners ?? []) partnerMap[p.name] = p.id

  // ── 3. Partner rooms ──────────────────────────────────────────

  const rooms = [
    {
      partner_name: 'Madrid Student Rooms',
      title: 'Premium Studio — Salamanca district',
      description: 'Stunning fully-furnished studio in the upscale Salamanca neighbourhood. Brand new renovation with designer furniture, high-end kitchen appliances and a luxurious bathroom. Private entry, secure building with concierge. Perfect for students who want premium comfort in the best address in Madrid.',
      neighborhood: 'Salamanca',
      room_type: 'studio' as const,
      monthly_rent: 950,
      deposit_amount: 950,
      platform_fee: 50,
      available_from: d(10),
      bills_included: true,
      flatmates_count: 0,
      flatmates_nationalities: [],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Private bathroom', 'Washing machine', 'Dishwasher'],
      gender_preference: 'any' as const,
      featured: true,
      photos: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      ],
    },
    {
      partner_name: 'Madrid Student Rooms',
      title: 'Modern room — Malasaña, international flat',
      description: 'Private room in a modern, fully-equipped flat in Malasaña — the most popular student area in Madrid. 2 other international students already living there. The flat has a great kitchen and living room. Bills and wifi included. Weekly cleaning service for common areas. Direct metro to Puerta del Sol.',
      neighborhood: 'Malasaña',
      room_type: 'private_room' as const,
      monthly_rent: 560,
      deposit_amount: 560,
      platform_fee: 50,
      available_from: d(5),
      bills_included: true,
      flatmates_count: 2,
      flatmates_nationalities: ['🇩🇪', '🇫🇷'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Washing machine'],
      gender_preference: 'any' as const,
      featured: true,
      photos: [
        'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800&q=80',
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      ],
    },
    {
      partner_name: 'Madrid Student Rooms',
      title: 'Cosy room in La Latina — historic centre',
      description: 'Charming private room in a classic Madrid flat in La Latina. The building has original early-20th century architecture with high ceilings and beautiful tiles. 3 other flatmates — international mix. Amazing location for nightlife and culture — steps from the famous tapas bars of Cava Baja.',
      neighborhood: 'La Latina',
      room_type: 'private_room' as const,
      monthly_rent: 480,
      deposit_amount: 480,
      platform_fee: 50,
      available_from: d(8),
      bills_included: true,
      flatmates_count: 3,
      flatmates_nationalities: ['🇮🇹', '🇵🇹', '🇬🇷'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Washing machine'],
      gender_preference: 'any' as const,
      featured: true,
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80',
      ],
    },
    {
      partner_name: 'Erasmus Housing Madrid',
      title: 'Affordable room — Lavapiés, great location',
      description: 'Budget-friendly private room in Lavapiés, one of the most authentic and affordable neighbourhoods in Madrid. Shared flat with 3 others — always an international atmosphere. The area has amazing food from all over the world, independent cinemas and a great arts scene. Close to Atocha station.',
      neighborhood: 'Lavapiés',
      room_type: 'private_room' as const,
      monthly_rent: 350,
      deposit_amount: 350,
      platform_fee: 50,
      available_from: d(3),
      bills_included: false,
      flatmates_count: 3,
      flatmates_nationalities: ['🇪🇸', '🇫🇷', '🇲🇦'],
      amenities: ['WiFi', 'Furnished', 'Washing machine'],
      gender_preference: 'any' as const,
      featured: false,
      photos: [
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      ],
    },
    {
      partner_name: 'Erasmus Housing Madrid',
      title: 'Bright room near Retiro Park',
      description: 'Sunny private room in a quiet residential building a short walk from Retiro Park. The flat is on the 5th floor with great natural light throughout the day. Modern furnishings, spacious kitchen and a comfortable living room. 2 Spanish flatmates — professional, clean and respectful.',
      neighborhood: 'Retiro',
      room_type: 'private_room' as const,
      monthly_rent: 580,
      deposit_amount: 580,
      platform_fee: 50,
      available_from: d(15),
      bills_included: true,
      flatmates_count: 2,
      flatmates_nationalities: ['🇪🇸', '🇪🇸'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Washing machine'],
      gender_preference: 'any' as const,
      featured: false,
      photos: [
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      ],
    },
    {
      partner_name: 'Erasmus Housing Madrid',
      title: 'Erasmus flat — Moncloa, near university',
      description: 'Private room in an Erasmus-only flat in Moncloa, right next to Complutense and other Madrid universities. The flat is specifically set up for international students — everyone here is on exchange. Very social atmosphere. Common areas shared with 4 other students. Bus and metro to all campuses directly from the door.',
      neighborhood: 'Moncloa',
      room_type: 'private_room' as const,
      monthly_rent: 450,
      deposit_amount: 450,
      platform_fee: 50,
      available_from: d(12),
      bills_included: true,
      flatmates_count: 4,
      flatmates_nationalities: ['🇩🇪', '🇵🇱', '🇮🇹', '🇨🇿'],
      amenities: ['WiFi', 'AC', 'Bills included', 'Furnished', 'Washing machine'],
      gender_preference: 'any' as const,
      featured: false,
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      ],
    },
  ]

  for (const { partner_name, photos, ...room } of rooms) {
    const partnerId = partnerMap[partner_name]
    if (!partnerId) continue
    const { error } = await supabase.from('partner_rooms').insert({
      ...room,
      partner_id: partnerId,
      photos,
      status: 'available' as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    if (error) return NextResponse.json({ error: `room "${room.title}": ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    student_listings: listings.length,
    partners: partners.length,
    partner_rooms: rooms.length,
  })
}
