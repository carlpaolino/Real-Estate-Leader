/**
 * Dev-only: insert 10 demo leads for a Supabase auth user via the service role key.
 * Loads .env / .env.local (dotenv default). Does not run application API routes.
 *
 * Usage:
 *   USER_ID=<uuid> node scripts/seed-dev-leads.js
 *   node scripts/seed-dev-leads.js <uuid>
 */
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config()
require('dotenv').config({ path: '.env.local', override: true })

const USER_ID = process.env.USER_ID || process.argv[2]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!USER_ID) {
  console.error('Missing USER_ID. Set env USER_ID or pass as first argument.')
  process.exit(1)
}
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const statuses = [
  'new',
  'contacted',
  'responded',
  'offer_made',
  'dead_lead',
  'new',
  'contacted',
  'responded',
  'offer_made',
  'new',
]

const scores = [88, 72, 61, 94, 31, 45, 79, 56, 83, 22]

const foreclosureTypes = ['NOD', 'Lis Pendens', 'Auction', 'Tax Sale']

const counties = [
  'Los Angeles',
  'Orange',
  'San Diego',
  'Riverside',
  'San Bernardino',
  'Ventura',
  'Santa Clara',
  'Sacramento',
  'Alameda',
  'San Francisco',
]

function signalsVariant(i) {
  const base = {
    pre_foreclosure: true,
    vacant: false,
    code_violations: false,
    probate: false,
    divorce: false,
    long_term_ownership: false,
    expired_listing: false,
  }
  const variants = [
    { vacant: true, long_term_ownership: true },
    { code_violations: true, pre_foreclosure: true },
    { probate: true },
    { divorce: true, vacant: true },
    { expired_listing: true },
    { long_term_ownership: true },
    { code_violations: true, vacant: true },
    { pre_foreclosure: true, expired_listing: true },
    { vacant: true, code_violations: true },
    { probate: true, long_term_ownership: true },
  ]
  return { ...base, ...variants[i % variants.length] }
}

function filingDateForIndex(i) {
  const d = new Date()
  d.setDate(d.getDate() - (30 + i * 7))
  return d.toISOString().slice(0, 10)
}

function lastContactedForStatus(status, i) {
  if (status === 'new') return null
  const d = new Date()
  d.setDate(d.getDate() - (3 + i))
  return d.toISOString()
}

function responseReceivedForStatus(status) {
  if (status === 'responded' || status === 'offer_made') return true
  if (status === 'dead_lead') return false
  return false
}

const streetNames = [
  'Elm',
  'Maple',
  'Cedar',
  'Willow',
  'Aspen',
  'Magnolia',
  'Birch',
  'Sycamore',
  'Laurel',
  'Mulberry',
]

const owners = [
  'Jordan Lee',
  'Priya Shah',
  'Marcus Chen',
  'Sofia Alvarez',
  'Alex Nguyen',
  'Taylor Brooks',
  'Riley Morgan',
  'Casey Rivera',
  'Jamie Patel',
  'Sam Okonkwo',
]

async function main() {
  const { data: userData, error: userErr } =
    await supabase.auth.admin.getUserById(USER_ID)
  if (userErr || !userData?.user) {
    console.error('No auth user for USER_ID (check the UUID):', userErr?.message || userErr)
    process.exit(1)
  }

  const now = new Date().toISOString()
  const rows = Array.from({ length: 10 }, (_, i) => {
    const status = statuses[i]
    const num = 2100 + i * 137
    return {
      user_id: USER_ID,
      address: `${num} ${streetNames[i]} St, Demo City, CA 9021${i}`,
      owner_name: owners[i],
      phone: `555-20${i}-000${i}`,
      email: `demo.lead.${i + 1}@example.com`,
      foreclosure_type: foreclosureTypes[i % foreclosureTypes.length],
      filing_date: filingDateForIndex(i),
      score: scores[i],
      status,
      notes:
        status === 'dead_lead'
          ? 'Opted out; no further contact.'
          : status === 'offer_made'
            ? 'Verbal interest; send contract.'
            : null,
      county: counties[i],
      property_value: 450_000 + i * 42_500,
      equity_percentage: 12 + i * 3.5,
      created_at: now,
      updated_at: now,
      last_contacted: lastContactedForStatus(status, i),
      response_received: responseReceivedForStatus(status),
      signals: signalsVariant(i),
    }
  })

  const { data, error } = await supabase.from('leads').insert(rows).select('id, address, status, score')

  if (error) {
    console.error('Insert failed:', error.message, error)
    process.exit(1)
  }

  console.log(`Inserted ${data.length} demo leads for user ${USER_ID}:`)
  for (const row of data) {
    console.log(`  ${row.id}  ${row.status}  score=${row.score}  ${row.address}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
