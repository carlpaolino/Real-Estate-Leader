const axios = require('axios');
require('dotenv').config();

console.log('=== Checking Field Names from Record ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = 'tblbKQ5XWYPad6LJO';

// Get a record to see the actual field names
const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

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
  console.log('✅ Record retrieved');
  console.log('Records found:', response.data.records.length);
  
  if (response.data.records.length > 0) {
    const record = response.data.records[0];
    console.log('\nActual field names in the record:');
    Object.keys(record.fields).forEach(fieldName => {
      console.log(`  - "${fieldName}"`);
    });
    
    console.log('\nSample record data:');
    console.log(JSON.stringify(record.fields, null, 2));
  }
})
.catch(error => {
  console.log('❌ Error:', error.response ? error.response.data : error.message);
});
