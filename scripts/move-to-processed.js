const Airtable = require('airtable');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class LeadProcessor {
  constructor() {
    this.processedTable = base('Processed Leads');
    this.rawTable = base('Raw Foreclosure Data');
  }

  async getScoredLeads() {
    try {
      const records = await this.rawTable.select({
        filterByFormula: 'AND({Scored} = TRUE(), {Moved to Processed} = FALSE())',
        maxRecords: 100
      }).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching scored leads:', error);
      return [];
    }
  }

  async createProcessedLead(rawLead) {
    try {
      const processedRecord = {
        fields: {
          'Lead ID': [rawLead.id], // Link to Raw Foreclosure Data
          'Address': rawLead['Address'],
          'Owner Name': rawLead['Owner Name'],
          'Phone': rawLead['Phone'],
          'Email': rawLead['Email'],
          'Score': rawLead['Score'],
          'Property Value': rawLead['Property Value'],
          'Equity Percentage': rawLead['Equity Percentage'],
          'Signals': rawLead['Signals'],
          'Status': 'New',
          'Campaign Status': 'Not Started',
          'Processed At': new Date().toISOString()
        }
      };

      const result = await this.processedTable.create([processedRecord]);
      console.log(`Created processed lead for ${rawLead.owner_name}`);
      return result[0];
    } catch (error) {
      console.error(`Error creating processed lead for ${rawLead.owner_name}:`, error);
      return null;
    }
  }

  async markAsMoved(rawLeadId) {
    try {
      await this.rawTable.update([
        {
          id: rawLeadId,
          fields: {
            'Moved to Processed': true,
            'Moved At': new Date().toISOString()
          }
        }
      ]);
      console.log(`Marked record ${rawLeadId} as moved`);
      return true;
    } catch (error) {
      console.error(`Error marking record ${rawLeadId} as moved:`, error);
      return false;
    }
  }

  async processLeads() {
    console.log('Starting lead processing...');
    
    const scoredLeads = await this.getScoredLeads();
    console.log(`Found ${scoredLeads.length} scored leads to process`);

    let processed = 0;
    let successful = 0;

    for (const lead of scoredLeads) {
      try {
        console.log(`Processing: ${lead['Owner Name']} at ${lead['Address']}`);
        
        const processedLead = await this.createProcessedLead(lead);
        
        if (processedLead) {
          await this.markAsMoved(lead.id);
          successful++;
        }
        
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        processed++;
      }
    }

    console.log(`Processing completed. Processed: ${processed}, Successful: ${successful}`);
    return { processed, successful };
  }

  async run() {
    try {
      const results = await this.processLeads();
      console.log('Lead processing results:', results);
    } catch (error) {
      console.error('Lead processing failed:', error);
    }
  }
}

// Run the processor
if (require.main === module) {
  const processor = new LeadProcessor();
  processor.run().catch(console.error);
}

module.exports = { LeadProcessor };
