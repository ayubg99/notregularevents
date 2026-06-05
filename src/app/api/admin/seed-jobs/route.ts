import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const expires = new Date(Date.now() + 30 * 86400000).toISOString()

  // ── 1. Employer accounts ──────────────────────────────────────

  const employers = [
    {
      company_name:    'La Pepica Restaurant',
      contact_name:    'Carlos Martínez',
      email:           'jobs@lapepica.es',
      phone:           '+34963710366',
      plan:            'subscription' as const,
      company_logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80',
      description:     'Iconic seafood restaurant on Malvarrosa beach since 1898.',
    },
    {
      company_name:    'Akuarela Beach Club',
      contact_name:    'Sandra López',
      email:           'hr@akuarelabeach.com',
      phone:           '+34963563702',
      plan:            'featured' as const,
      company_logo_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=200&q=80',
      description:     "Valencia's most popular beach club on Malvarrosa.",
    },
    {
      company_name:    'Valencia Tech Hub',
      contact_name:    'Alejandro García',
      email:           'info@valenciatechstartup.com',
      phone:           '+34961234567',
      plan:            'free' as const,
      company_logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80',
      description:     'SaaS startup building tools for international communities.',
    },
    {
      company_name:    'Cervecería España',
      contact_name:    'María Fernández',
      email:           'staff@cerveceriaespanya.com',
      phone:           '+34963456789',
      plan:            'free' as const,
      company_logo_url: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=200&q=80',
      description:     'Traditional Spanish restaurant and cervecería in the city centre.',
    },
    {
      company_name:    'Nomad Coliving Valencia',
      contact_name:    'David Chen',
      email:           'contact@nomadcolivingvlc.com',
      phone:           '+34962345678',
      plan:            'featured' as const,
      company_logo_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&q=80',
      description:     'Coliving space for digital nomads and international students in Ruzafa.',
    },
  ]

  const { data: insertedEmployers, error: employersError } = await supabase
    .from('employer_accounts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(employers.map(e => ({ ...e, user_id: null })) as any)
    .select('id, email')

  if (employersError) return NextResponse.json({ error: 'employers: ' + employersError.message }, { status: 500 })

  const employerMap: Record<string, string> = {}
  for (const e of insertedEmployers ?? []) employerMap[e.email] = e.id

  // ── 2. Job listings ───────────────────────────────────────────

  type JobRow = {
    employer_email: string
    title: string
    company_name: string
    company_logo_url: string
    description: string
    requirements: string
    location: string
    job_type: 'part_time' | 'internship' | 'full_time' | 'freelance' | 'volunteer'
    category: 'hospitality' | 'marketing' | 'tech' | 'education' | 'retail' | 'events' | 'language' | 'other'
    salary_text: string
    hours_per_week: number
    language_required: 'english' | 'spanish' | 'both' | 'any'
    apply_email: string
    apply_whatsapp: string | null
    contact_name: string
    is_featured: boolean
    is_urgent: boolean
  }

  const jobs: JobRow[] = [
    {
      employer_email:   'jobs@lapepica.es',
      title:            'Waiter / Waitress — Summer Season',
      company_name:     'La Pepica Restaurant',
      company_logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80',
      description:      'La Pepica is one of the most iconic seafood restaurants in Valencia, located on Malvarrosa beach. We are looking for enthusiastic waitstaff for the summer season. You will take orders, serve food and drinks, and ensure an excellent guest experience in our busy beachfront restaurant. Flexible shifts around your studies — perfect for Erasmus students.',
      requirements:     'Friendly personality. Basic Spanish helpful but not required. Experience a plus but we will train you. Must be available weekends.',
      location:         'Playa de la Malvarrosa, Valencia',
      job_type:         'part_time',
      category:         'hospitality',
      salary_text:      '€800–€1,000/month + tips',
      hours_per_week:   25,
      language_required: 'any',
      apply_email:      'jobs@lapepica.es',
      apply_whatsapp:   '+34963710366',
      contact_name:     'Carlos Martínez',
      is_featured:      true,
      is_urgent:        true,
    },
    {
      employer_email:   'hr@akuarelabeach.com',
      title:            'Bar Staff — Beach Club',
      company_name:     'Akuarela Beach Club',
      company_logo_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=200&q=80',
      description:      'Join the team at Akuarela, Valencia\'s most popular beach club! We need energetic bar staff for the summer season. You will prepare cocktails and drinks, serve customers at the bar and keep everything organised. Working on the beach with amazing views — the best summer job in Valencia!',
      requirements:     'English required. Spanish a plus. Must be social and energetic. Shifts mostly evenings and nights. 18+ only.',
      location:         'Akuarela Beach Club, Playa de la Malvarrosa',
      job_type:         'part_time',
      category:         'hospitality',
      salary_text:      '€750–€900/month + tips',
      hours_per_week:   20,
      language_required: 'english',
      apply_email:      'hr@akuarelabeach.com',
      apply_whatsapp:   '+34963563702',
      contact_name:     'Sandra López',
      is_featured:      true,
      is_urgent:        false,
    },
    {
      employer_email:   'hr@akuarelabeach.com',
      title:            'Event Promoter — International Nights',
      company_name:     'Akuarela Beach Club',
      company_logo_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=200&q=80',
      description:      'We are looking for outgoing international students to promote our Monday international nights. Your job is to bring friends and students to our events. Flexible hours — mainly social media and word of mouth. Great commission structure and free entry to all our events.',
      requirements:     'Must be an international student in Valencia. Active on social media. Outgoing personality. Own network of international students is a big plus.',
      location:         'Valencia (remote + events)',
      job_type:         'freelance',
      category:         'events',
      salary_text:      '€5 commission per person + free entry',
      hours_per_week:   10,
      language_required: 'english',
      apply_email:      'hr@akuarelabeach.com',
      apply_whatsapp:   '+34963563702',
      contact_name:     'Sandra López',
      is_featured:      false,
      is_urgent:        false,
    },
    {
      employer_email:   'info@valenciatechstartup.com',
      title:            'Social Media & Marketing Intern',
      company_name:     'Valencia Tech Hub',
      company_logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80',
      description:      'Valencia-based SaaS startup looking for a creative marketing intern. You will manage our Instagram and LinkedIn, create content, run paid campaigns and help grow our brand. Real responsibility from day one — not just making coffee. Free co-working space included.',
      requirements:     'Marketing or communications student. Familiar with Instagram, TikTok and LinkedIn. Basic video editing skills a plus. English required.',
      location:         'Ciudad de las Artes, Valencia',
      job_type:         'internship',
      category:         'marketing',
      salary_text:      'Unpaid + free co-working access',
      hours_per_week:   20,
      language_required: 'english',
      apply_email:      'info@valenciatechstartup.com',
      apply_whatsapp:   null,
      contact_name:     'Alejandro García',
      is_featured:      false,
      is_urgent:        false,
    },
    {
      employer_email:   'info@valenciatechstartup.com',
      title:            'Front-end Developer Intern',
      company_name:     'Valencia Tech Hub',
      company_logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80',
      description:      'Fast-growing tech startup looking for a frontend developer intern. You will work on real products used by thousands of users — React, TypeScript and modern CSS. You will learn from senior developers and have real ownership of features from day one. Remote-friendly with occasional office days.',
      requirements:     'Computer science or engineering student. Knowledge of React or Vue.js. TypeScript a plus. Portfolio or GitHub required. English required.',
      location:         'Ciudad de las Artes, Valencia',
      job_type:         'internship',
      category:         'tech',
      salary_text:      '€500/month',
      hours_per_week:   30,
      language_required: 'english',
      apply_email:      'info@valenciatechstartup.com',
      apply_whatsapp:   null,
      contact_name:     'Alejandro García',
      is_featured:      false,
      is_urgent:        false,
    },
    {
      employer_email:   'staff@cerveceriaespanya.com',
      title:            'Kitchen Assistant — Spanish Restaurant',
      company_name:     'Cervecería España',
      company_logo_url: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=200&q=80',
      description:      'Traditional Spanish restaurant in the city centre looking for a kitchen assistant. You will help prepare tapas and traditional dishes, keep the kitchen clean and assist the head chef. No experience necessary — we will train you. Good opportunity to learn Spanish cooking and culture from the inside.',
      requirements:     'No experience required. Willing to learn. Good attitude. Some Spanish helpful. Available for lunch and dinner shifts.',
      location:         'City Centre, Valencia',
      job_type:         'part_time',
      category:         'hospitality',
      salary_text:      '€700–€800/month',
      hours_per_week:   20,
      language_required: 'any',
      apply_email:      'staff@cerveceriaespanya.com',
      apply_whatsapp:   '+34963456789',
      contact_name:     'María Fernández',
      is_featured:      false,
      is_urgent:        false,
    },
    {
      employer_email:   'staff@cerveceriaespanya.com',
      title:            'Waiter for Terrace — English Speaking',
      company_name:     'Cervecería España',
      company_logo_url: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=200&q=80',
      description:      'We are looking for an English-speaking waiter for our popular summer terrace. Many of our customers are tourists and international visitors so English is essential. Friendly team, good tips and a flexible schedule that works around your Erasmus studies.',
      requirements:     'English required. Basic Spanish. Customer service experience preferred. Available weekends. Friendly and professional attitude.',
      location:         'City Centre, Valencia',
      job_type:         'part_time',
      category:         'hospitality',
      salary_text:      '€800/month + tips',
      hours_per_week:   25,
      language_required: 'both',
      apply_email:      'staff@cerveceriaespanya.com',
      apply_whatsapp:   '+34963456789',
      contact_name:     'María Fernández',
      is_featured:      false,
      is_urgent:        true,
    },
    {
      employer_email:   'contact@nomadcolivingvlc.com',
      title:            'Community Manager — Coliving Space',
      company_name:     'Nomad Coliving Valencia',
      company_logo_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&q=80',
      description:      'We run a coliving space for digital nomads and international students in Ruzafa. Looking for an outgoing community manager to organise weekly events, welcome new residents, manage our social media and make our community the best in Valencia. You will also get free breakfast every morning.',
      requirements:     'Social and outgoing personality. Experience with events or community management is a plus. English required. Spanish helpful. Must live in or near Valencia.',
      location:         'Ruzafa, Valencia',
      job_type:         'part_time',
      category:         'events',
      salary_text:      '€900/month',
      hours_per_week:   25,
      language_required: 'english',
      apply_email:      'contact@nomadcolivingvlc.com',
      apply_whatsapp:   '+34962345678',
      contact_name:     'David Chen',
      is_featured:      true,
      is_urgent:        false,
    },
    {
      employer_email:   'contact@nomadcolivingvlc.com',
      title:            'English / French Language Teacher',
      company_name:     'Nomad Coliving Valencia',
      company_logo_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&q=80',
      description:      'Teach English or French to Spanish students and professionals. Flexible schedule — you choose your hours. Classes held at our coliving space in Ruzafa or online via Zoom. Perfect for Erasmus students who are native or near-native English or French speakers looking to earn extra income.',
      requirements:     'Native or near-native English or French speaker. Teaching experience a plus but not required. Patient and friendly personality. Minimum 10 hours per week.',
      location:         'Ruzafa, Valencia / Remote',
      job_type:         'part_time',
      category:         'language',
      salary_text:      '€12–€15/hour',
      hours_per_week:   10,
      language_required: 'english',
      apply_email:      'contact@nomadcolivingvlc.com',
      apply_whatsapp:   '+34962345678',
      contact_name:     'David Chen',
      is_featured:      false,
      is_urgent:        false,
    },
    {
      employer_email:   'hr@akuarelabeach.com',
      title:            'Erasmus Life Brand Ambassador',
      company_name:     'Erasmus Life Valencia',
      company_logo_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80',
      description:      'Become the face of Erasmus Life Valencia on your university campus! Promote our events, trips and platform to fellow Erasmus students. Earn commission on every booking you generate, plus a free membership and event tickets. Flexible hours — fits perfectly around your Erasmus schedule.',
      requirements:     'Current Erasmus student in Valencia. Active social life and student network. Social media presence. Enthusiastic about the Erasmus experience.',
      location:         'Valencia — All Universities',
      job_type:         'volunteer',
      category:         'events',
      salary_text:      '5% commission on all referrals + free membership',
      hours_per_week:   5,
      language_required: 'english',
      apply_email:      'hr@akuarelabeach.com',
      apply_whatsapp:   '+34963563702',
      contact_name:     'Sandra López',
      is_featured:      true,
      is_urgent:        false,
    },
  ]

  for (const { employer_email, ...job } of jobs) {
    const employer_account_id = employerMap[employer_email] ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('job_listings').insert({
      ...job,
      employer_account_id,
      posted_by_user_id: null,
      status: 'active' as const,
      expires_at: expires,
    } as any)
    if (error) return NextResponse.json({ error: `job "${job.title}": ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    employers: employers.length,
    jobs: jobs.length,
  })
}
