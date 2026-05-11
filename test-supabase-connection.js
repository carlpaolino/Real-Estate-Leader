// Quick test script to verify Supabase connection
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl || '❌ NOT SET')
console.log('Key exists:', !!supabaseKey)
console.log('Key length:', supabaseKey?.length || 0)
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure .env exists in the project root and has:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

// Test URL format
if (!supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid Supabase URL format!')
  console.error('URL should be: https://xxxxx.supabase.co')
  process.exit(1)
}

// Test if URL is reachable
const https = require('https')
const url = new URL(supabaseUrl)

console.log('🌐 Testing connection to:', supabaseUrl)
console.log('')

const req = https.request({
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  },
  timeout: 5000
}, (res) => {
  console.log('✅ Connection successful!')
  console.log('Status:', res.statusCode)
  console.log('')
  console.log('🎉 Your Supabase connection is working!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Make sure your dev server is restarted')
  console.log('2. Check browser console for specific errors')
  console.log('3. Verify Supabase project is active (not paused)')
})

req.on('error', (error) => {
  console.error('❌ Connection failed!')
  console.error('Error:', error.message)
  console.log('')
  console.log('Possible issues:')
  console.log('1. Wrong Supabase URL')
  console.log('2. Project is paused')
  console.log('3. Network/firewall blocking connection')
  console.log('4. Invalid API key')
  process.exit(1)
})

req.on('timeout', () => {
  console.error('❌ Connection timeout!')
  req.destroy()
  process.exit(1)
})

req.end()

