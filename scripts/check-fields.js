const axios = require('axios');
require('dotenv').config();

console.log('=== Checking Field Names ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = 'tblbKQ5XWYPad6LJO';

// Get table schema to see actual field names
const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${TABLE_ID}`;

axios.get(url, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Table schema retrieved');
  console.log('Table name:', response.data.name);
  console.log('\nField names:');
  response.data.fields.forEach(field => {
    console.log(`  - "${field.name}" (${field.type})`);
  });
})
.catch(error => {
  console.log('❌ Error:', error.response ? error.response.data : error.message);
});
