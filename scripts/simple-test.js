const Airtable = require('airtable');
require('dotenv').config();

console.log('=== Airtable Connection Test ===');
console.log('API Key length:', process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.length : 'Missing');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID);

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

// Test with just the base connection first
try {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  console.log('✅ Base object created successfully');
  
  // Try to access the first table
  console.log('\nTesting table access...');
  const table = base('Raw Foreclosure Data');
  console.log('✅ Table object created successfully');
  
  // Try a simple query
  table.select({ maxRecords: 1 }).firstPage((err, records) => {
    if (err) {
      console.log('❌ Error querying table:', err.message);
    } else {
      console.log('✅ Successfully queried table');
      console.log('Records found:', records.length);
    }
  });
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
