const Airtable = require('airtable');
const axios = require('axios');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class SkipTracer {
  constructor() {
    this.apiKey = process.env.SKIP_TRACE_API_KEY;
    this.baseUrl = 'https://api.reiskip.com/v1'; // Example API endpoint
  }

  async getRawLeads() {
    try {
      const records = await base('Raw Foreclosure Data').select({
        filterByFormula: '{Contact Info Added} = FALSE()',
        maxRecords: 100
      }).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching raw leads:', error);
      return [];
    }
  }

  async skipTracePerson(name, address) {
    try {
      // For demo purposes, use mock data instead of real API calls
      console.log(`  Skip tracing ${name} at ${address} (using mock data)`);
      
      // Return mock contact info
      return {
        phone: this.generateMockPhone(),
        email: this.generateMockEmail(name),
        alternate_address: null
      };

    } catch (error) {
      console.error(`Error skip tracing for ${name}:`, error.message);
      return null;
    }
  }

  async searchTruePeopleSearch(name, address) {
    try {
      // This is a simplified example - in production you'd need to handle
      // the actual TruePeopleSearch scraping with proper rate limiting
      const searchUrl = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(name)}&citystatezip=${encodeURIComponent(address)}`;
      
      // For demo purposes, return mock data
      // In production, you'd use Puppeteer to scrape the results
      return {
        phone: this.generateMockPhone(),
        email: this.generateMockEmail(name),
        alternate_address: null
      };
    } catch (error) {
      console.error('Error searching TruePeopleSearch:', error);
      return null;
    }
  }

  parseSkipTraceResults(results) {
    if (!results || results.length === 0) return null;

    const bestMatch = results[0]; // Assume first result is best match
    
    return {
      phone: bestMatch.phone || null,
      email: bestMatch.email || null,
      alternate_address: bestMatch.address || null
    };
  }

  generateMockPhone() {
    // Generate a realistic phone number for demo purposes
    const areaCodes = ['213', '323', '310', '818', '562', '714', '949', '951'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}-${prefix}-${line}`;
  }

  generateMockEmail(name) {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const randomNum = Math.floor(Math.random() * 999);
    return `${cleanName}${randomNum}@${domain}`;
  }

  async updateLeadWithContactInfo(recordId, contactInfo) {
    try {
      await base('Raw Foreclosure Data').update([
        {
          id: recordId,
                  fields: {
          'Phone': contactInfo.phone,
          'Email': contactInfo.email,
          'Alternate Address': contactInfo.alternate_address,
          'Contact Info Added': true,
          'Skipped Traced At': new Date().toISOString().split('T')[0]
        }
        }
      ]);

      console.log(`Updated record ${recordId} with contact info`);
      return true;
    } catch (error) {
      console.error(`Error updating record ${recordId}:`, error);
      return false;
    }
  }

  async processLeads() {
    console.log('Starting skip tracing process...');
    
    const rawLeads = await this.getRawLeads();
    console.log(`Found ${rawLeads.length} leads to process`);

    let processed = 0;
    let successful = 0;

    for (const lead of rawLeads) {
      try {
        console.log(`Processing: ${lead['Owner Name']} at ${lead['Address']}`);
        
        const contactInfo = await this.skipTracePerson(lead['Owner Name'], lead['Address']);
        
        if (contactInfo) {
          const updated = await this.updateLeadWithContactInfo(lead.id, contactInfo);
          if (updated) successful++;
        }
        
        processed++;
        
        // Rate limiting - be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        processed++;
      }
    }

    console.log(`Skip tracing completed. Processed: ${processed}, Successful: ${successful}`);
    return { processed, successful };
  }

  async run() {
    try {
      const results = await this.processLeads();
      console.log('Skip tracing results:', results);
    } catch (error) {
      console.error('Skip tracing failed:', error);
    }
  }
}

// Run the skip tracer
if (require.main === module) {
  const skipTracer = new SkipTracer();
  skipTracer.run().catch(console.error);
}

module.exports = { SkipTracer }; 