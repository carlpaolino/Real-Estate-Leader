const Airtable = require('airtable');
require('dotenv').config();

console.log('=== Debugging Airtable Tables ===');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function debugTables() {
  const tableNames = ['Raw Foreclosure Data', 'Processed Leads', 'Campaign Results'];
  
  for (const tableName of tableNames) {
    console.log(`\n--- Testing "${tableName}" ---`);
    
    try {
      const table = base(tableName);
      
      // Try to get table metadata
      console.log(`✅ Table "${tableName}" exists`);
      
      // Try to list fields by attempting a query
      table.select({ maxRecords: 1 }).firstPage((err, records) => {
        if (err) {
          console.log(`❌ Error querying "${tableName}":`, err.message);
          
          if (err.message.includes('Could not find what you are looking for')) {
            console.log(`   This usually means the table "${tableName}" is empty or has no fields`);
            console.log(`   Try adding at least one field to the table in Airtable`);
          }
        } else {
          console.log(`✅ Successfully queried "${tableName}"`);
          console.log(`   Records found: ${records.length}`);
          
          if (records.length > 0) {
            console.log(`   Sample record fields:`, Object.keys(records[0].fields));
          }
        }
      });
      
    } catch (error) {
      console.log(`❌ Error accessing "${tableName}":`, error.message);
    }
  }
}

debugTables().catch(console.error);
