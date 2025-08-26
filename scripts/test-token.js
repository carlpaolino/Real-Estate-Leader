require('dotenv').config();

console.log('=== Testing Token Reading ===');
console.log('Token starts with:', process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.substring(0, 10) + '...' : 'Missing');
console.log('Token length:', process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.length : 'Missing');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID);

// Check if it's a personal access token (should start with 'pat')
if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_API_KEY.startsWith('pat')) {
  console.log('✅ Token appears to be a valid personal access token');
} else {
  console.log('❌ Token does not appear to be a personal access token');
}
