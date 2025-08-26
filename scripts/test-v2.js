const Airtable = require('airtable');
require('dotenv').config();

console.log('=== Testing Airtable Connection V2 ===');

// Test with a simpler approach
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Try to create a single record with minimal fields
const testRecord = {
  fields: {
    'A Address': '123 Test Street, Los Angeles, CA',
    'A Owner Name': 'Test Owner',
    'Foreclosure Type': 'NOD',
    'Filing Date': new Date().toISOString().split('T')[0],
    'A County': 'Los Angeles',
    'Scraped At': new Date().toISOString().split('T')[0],
    'A Phone': '',
    'A Email': '',
    'A Alternate Address': '',
    'Contact Info Added': false
  }
};

console.log('Attempting to create test record...');
console.log('Record data:', JSON.stringify(testRecord, null, 2));

base('Raw Foreclosure Data').create([testRecord], (err, records) => {
  if (err) {
    console.log('❌ Error creating record:', err.message);
    console.log('Error details:', err);
  } else {
    console.log('✅ Successfully created test record!');
    console.log('Record ID:', records[0].id);
  }
});
