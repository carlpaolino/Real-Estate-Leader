const axios = require('axios');
require('dotenv').config();

console.log('=== Comprehensive Airtable Test ===');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

console.log('Token starts with:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'Missing');
console.log('Base ID:', BASE_ID);

// Test 1: Try to get base metadata
console.log('\n--- Test 1: Base Metadata ---');
const metaUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;

axios.get(metaUrl, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Base metadata accessible');
  console.log('Tables found:', response.data.tables.length);
  response.data.tables.forEach(table => {
    console.log(`  - ${table.name} (ID: ${table.id})`);
  });
})
.catch(error => {
  console.log('❌ Base metadata error:', error.response ? error.response.status : error.message);
});

// Test 2: Try with table name
console.log('\n--- Test 2: Table by Name ---');
const tableNameUrl = `https://api.airtable.com/v0/${BASE_ID}/Raw%20Foreclosure%20Data`;

axios.get(tableNameUrl, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  params: { maxRecords: 1 }
})
.then(response => {
  console.log('✅ Table by name accessible');
  console.log('Records found:', response.data.records.length);
})
.catch(error => {
  console.log('❌ Table by name error:', error.response ? error.response.status : error.message);
});

// Test 3: Try with table ID
console.log('\n--- Test 3: Table by ID ---');
const tableIdUrl = `https://api.airtable.com/v0/${BASE_ID}/tblbKQ5XWYPad6LJO`;

axios.get(tableIdUrl, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  params: { maxRecords: 1 }
})
.then(response => {
  console.log('✅ Table by ID accessible');
  console.log('Records found:', response.data.records.length);
})
.catch(error => {
  console.log('❌ Table by ID error:', error.response ? error.response.status : error.message);
});

// Test 4: Try to list all bases
console.log('\n--- Test 4: List All Bases ---');
const basesUrl = 'https://api.airtable.com/v0/meta/bases';

axios.get(basesUrl, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ All bases accessible');
  console.log('Bases found:', response.data.bases.length);
  response.data.bases.forEach(base => {
    console.log(`  - ${base.name} (ID: ${base.id})`);
  });
})
.catch(error => {
  console.log('❌ List bases error:', error.response ? error.response.status : error.message);
});
