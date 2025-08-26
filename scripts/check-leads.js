const Airtable = require('airtable');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function checkLeads() {
  try {
    console.log('=== Checking Available Leads ===');
    
    // Get all records
    const records = await base('Raw Foreclosure Data').select({
      maxRecords: 10
    }).all();

    console.log(`Found ${records.length} total records`);
    
    records.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  Address: ${record.fields['Address'] || 'N/A'}`);
      console.log(`  Owner: ${record.fields['Owner Name'] || 'N/A'}`);
      console.log(`  Contact Info Added: ${record.fields['Contact Info Added'] || false}`);
      console.log(`  Scored: ${record.fields['Scored'] || false}`);
      console.log(`  Phone: ${record.fields['Phone'] || 'N/A'}`);
    });

    // Check for leads ready to score
    const readyToScore = records.filter(record => 
      record.fields['Contact Info Added'] === true && 
      record.fields['Scored'] !== true
    );

    console.log(`\nLeads ready to score: ${readyToScore.length}`);

  } catch (error) {
    console.error('Error checking leads:', error);
  }
}

checkLeads().catch(console.error);
