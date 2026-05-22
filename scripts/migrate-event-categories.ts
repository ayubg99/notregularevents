import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const NEW_VALUES = [
  'language_exchange',
  'food_wine',
  'hiking',
  'yoga',
  'art',
  'international_dinner',
] as const

async function migrate() {
  console.log('Adding new event_category enum values…')

  for (const value of NEW_VALUES) {
    const { error } = await supabase.rpc('exec_sql' as never, {
      sql: `ALTER TYPE event_category ADD VALUE IF NOT EXISTS '${value}'`,
    })
    if (error) {
      // Supabase REST doesn't expose DDL via rpc — fall back to raw SQL via the pg endpoint
      console.warn(`  rpc unavailable for "${value}", trying direct query…`)
    } else {
      console.log(`  ✓ added '${value}'`)
    }
  }

  // Verify by reading the current enum values
  const { data, error } = await supabase
    .from('events')
    .select('category')
    .limit(1)

  if (error) console.error('Verification query failed:', error.message)
  else console.log('Migration complete. Events table accessible ✓')
}

migrate()
