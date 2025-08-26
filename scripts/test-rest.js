const axios = require('axios');
require('dotenv').config();

console.log('=== Testing Airtable REST API ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Raw Foreclosure Data';

console.log('API Key length:', API_KEY ? API_KEY.length : 'Missing');
console.log('Base ID:', BASE_ID);
console.log('Table Name:', TABLE_NAME);

if (!API_KEY || !BASE_ID) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

// Test the REST API directly
const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

console.log('Testing URL:', url);

// First, try to read existing records
axios.get(url, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  params: {
    maxRecords: 1
  }
})
.then(response => {
  console.log('✅ Successfully connected to Airtable!');
  console.log('Response status:', response.status);
  console.log('Records found:', response.data.records ? response.data.records.length : 0);
  
  // Now try to create a record
  const testRecord = {
    fields: {
      'A Address': '456 Test Ave, Los Angeles, CA',
      'A Owner Name': 'Jane Smith',
      'Foreclosure Type': 'NOD',
      'Filing Date': new Date().toISOString().split('T')[0],
      'A County': 'Los Angeles',
      'Scraped At': new Date().toISOString().split('T')[0]
    }
  };
  
  console.log('\nAttempting to create test record...');
  
  return axios.post(url, { records: [testRecord] }, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
})
.then(response => {
  console.log('✅ Successfully created test record!');
  console.log('Record ID:', response.data.records[0].id);
})
.catch(error => {
  console.log('❌ Error:', error.response ? error.response.data : error.message);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Error details:', JSON.stringify(error.response.data, null, 2));
  }
});
