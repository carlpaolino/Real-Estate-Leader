const Airtable = require('airtable');
require('dotenv').config();

console.log('Testing Airtable connection...');
console.log('API Key:', process.env.AIRTABLE_API_KEY ? '✅ Found' : '❌ Missing');
console.log('Base ID:', process.env.AIRTABLE_BASE_ID ? '✅ Found' : '❌ Missing');

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function testConnection() {
  try {
    console.log('\nTesting connection to base...');
    
    // Test each required table
    const requiredTables = ['Raw Foreclosure Data', 'Processed Leads', 'Campaign Results'];
    
    for (const tableName of requiredTables) {
      try {
        const table = base(tableName);
        const records = await table.select({ maxRecords: 1 }).all();
        console.log(`✅ Table "${tableName}" - Accessible (${records.length} records)`);
      } catch (error) {
        console.log(`❌ Table "${tableName}" - Error: ${error.message}`);
        
        if (error.message.includes('NOT_FOUND')) {
          console.log(`   This usually means the table "${tableName}" doesn't exist or has a different name`);
        }
      }
    }
    
    console.log('\n✅ Base connection test completed');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('NOT_FOUND')) {
      console.log('\nPossible issues:');
      console.log('1. Base ID is incorrect');
      console.log('2. API key doesn\'t have access to this base');
      console.log('3. Base doesn\'t exist');
    }
  }
}

testConnection().catch(console.error);
