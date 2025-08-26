const axios = require('axios');
require('dotenv').config();

console.log('=== Testing Base Access ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

console.log('Testing access to base:', BASE_ID);

// Try to access the base metadata
const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;

axios.get(url, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Successfully accessed base!');
  console.log('Available tables:');
  response.data.tables.forEach(table => {
    console.log(`  - ${table.name} (ID: ${table.id})`);
  });
})
.catch(error => {
  console.log('❌ Error accessing base:', error.response ? error.response.data : error.message);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Error details:', JSON.stringify(error.response.data, null, 2));
  }
});
