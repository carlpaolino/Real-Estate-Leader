const axios = require('axios');
require('dotenv').config();

console.log('=== Testing Record Creation ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = 'tblbKQ5XWYPad6LJO';

// Try to create a record with the field names from the interface
const testRecord = {
  records: [{
    fields: {
      'Address': '123 Test Street, Los Angeles, CA',
      'Owner Name': 'Test Owner',
      'Foreclosure Type': 'NOD',
      'Filing Date': new Date().toISOString().split('T')[0],
      'County': 'Los Angeles',
      'Scraped At': new Date().toISOString().split('T')[0]
    }
  }]
};

console.log('Attempting to create record with field names from interface...');
console.log('Record data:', JSON.stringify(testRecord, null, 2));

const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

axios.post(url, testRecord, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Successfully created test record!');
  console.log('Record ID:', response.data.records[0].id);
  console.log('Created fields:', Object.keys(response.data.records[0].fields));
})
.catch(error => {
  console.log('❌ Error creating record:', error.response ? error.response.data : error.message);
  if (error.response && error.response.data) {
    console.log('Error details:', JSON.stringify(error.response.data, null, 2));
  }
});
