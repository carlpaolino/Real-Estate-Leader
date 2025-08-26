const Airtable = require('airtable');
const axios = require('axios');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class LeadScorer {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async getProcessedLeads() {
    try {
      const records = await base('Raw Foreclosure Data').select({
        filterByFormula: 'AND({Contact Info Added} = TRUE(), {Scored} = FALSE())',
        maxRecords: 100
      }).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching processed leads:', error);
      return [];
    }
  }

  async getPropertyData(address) {
    try {
      // Get property data from county assessor or Zillow API
      const response = await axios.get(`https://api.bridgedataoutput.com/api/v2/assessments`, {
        headers: {
          'Authorization': `Bearer ${process.env.BRIDGE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        params: {
          access_token: process.env.BRIDGE_API_KEY,
          address: address
        },
        timeout: 10000
      });

      if (response.data && response.data.bundle) {
        const property = response.data.bundle[0];
        return {
          property_value: property.assessedValue || property.estimatedValue,
          equity_percentage: this.calculateEquityPercentage(property),
          ownership_years: this.calculateOwnershipYears(property),
          last_sale_date: property.lastSaleDate,
          last_sale_price: property.lastSalePrice
        };
      }
    } catch (error) {
      console.error(`Error getting property data for ${address}:`, error.message);
    }

    // Return mock data for demo
    return this.generateMockPropertyData();
  }

  calculateEquityPercentage(property) {
    if (!property.assessedValue || !property.lastSalePrice) return null;
    
    const currentValue = property.assessedValue;
    const purchasePrice = property.lastSalePrice;
    const equity = currentValue - purchasePrice;
    
    return Math.round((equity / currentValue) * 100);
  }

  calculateOwnershipYears(property) {
    if (!property.lastSaleDate) return null;
    
    const lastSale = new Date(property.lastSaleDate);
    const now = new Date();
    const years = (now - lastSale) / (1000 * 60 * 60 * 24 * 365);
    
    return Math.round(years);
  }

  generateMockPropertyData() {
    return {
      property_value: Math.floor(Math.random() * 500000) + 200000,
      equity_percentage: Math.floor(Math.random() * 60) + 20,
      ownership_years: Math.floor(Math.random() * 15) + 1,
      last_sale_date: new Date(Date.now() - Math.random() * 15 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_sale_price: Math.floor(Math.random() * 400000) + 150000
    };
  }

  async getStreetViewUrl(address) {
    try {
      if (!this.googleMapsApiKey) return null;

      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodedAddress}&key=${this.googleMapsApiKey}`;
      
      // Test if the URL returns a valid image
      const response = await axios.head(url);
      if (response.status === 200 && response.headers['content-type']?.includes('image/')) {
        return url;
      }
    } catch (error) {
      // Don't log error for missing street view - it's common
      console.log(`  No street view available for ${address}`);
    }
    
    return null;
  }

  calculateScore(lead, propertyData) {
    let score = 0;
    const signals = {
      pre_foreclosure: false,
      vacant: false,
      code_violations: false,
      probate: false,
      divorce: false,
      long_term_ownership: false,
      expired_listing: false
    };

    // Pre-foreclosure signal (highest weight)
    if (lead.foreclosure_type && lead.foreclosure_type !== '') {
      score += 40;
      signals.pre_foreclosure = true;
    }

    // Vacant/absentee property signal
    if (propertyData.ownership_years > 10) {
      score += 15;
      signals.vacant = true;
    }

    // Code violations (would need additional data source)
    // For demo, randomly assign
    if (Math.random() > 0.7) {
      score += 10;
      signals.code_violations = true;
    }

    // Probate/death signal (would need court records)
    // For demo, randomly assign
    if (Math.random() > 0.8) {
      score += 15;
      signals.probate = true;
    }

    // Divorce filing signal (would need court records)
    // For demo, randomly assign
    if (Math.random() > 0.85) {
      score += 10;
      signals.divorce = true;
    }

    // Long-term ownership + equity signal
    if (propertyData.ownership_years > 10 && propertyData.equity_percentage > 50) {
      score += 10;
      signals.long_term_ownership = true;
    }

    // Expired MLS listing signal
    // For demo, randomly assign
    if (Math.random() > 0.9) {
      score += 5;
      signals.expired_listing = true;
    }

    // Ensure score doesn't exceed 100
    score = Math.min(score, 100);

    return { score, signals };
  }

  async updateLeadWithScore(recordId, scoreData, propertyData, streetViewUrl) {
    try {
      await base('Raw Foreclosure Data').update([
        {
          id: recordId,
          fields: {
            'Score': scoreData.score,
            'Signals': JSON.stringify(scoreData.signals),
            'Property Value': propertyData.property_value,
            'Equity Percentage': propertyData.equity_percentage,
            'Ownership Years': propertyData.ownership_years,
            'Street View URL': streetViewUrl,
            'Scored': true,
            'Scored At': new Date().toISOString().split('T')[0]
          }
        }
      ]);

      console.log(`Updated record ${recordId} with score ${scoreData.score}`);
      return true;
    } catch (error) {
      console.error(`Error updating record ${recordId}:`, error);
      return false;
    }
  }

  async processLeads() {
    console.log('Starting lead scoring process...');
    
    const leads = await this.getProcessedLeads();
    console.log(`Found ${leads.length} leads to score`);

    let processed = 0;
    let successful = 0;

    for (const lead of leads) {
      try {
        console.log(`Scoring: ${lead['Owner Name']} at ${lead['Address']}`);
        
        // Get property data
        const propertyData = await this.getPropertyData(lead['Address']);
        
        // Calculate score
        const scoreData = this.calculateScore(lead, propertyData);
        
        // Get street view URL
        const streetViewUrl = await this.getStreetViewUrl(lead['Address']);
        
        // Update record
        const updated = await this.updateLeadWithScore(
          lead.id, 
          scoreData, 
          propertyData, 
          streetViewUrl
        );
        
        if (updated) successful++;
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        processed++;
      }
    }

    console.log(`Scoring completed. Processed: ${processed}, Successful: ${successful}`);
    return { processed, successful };
  }

  async run() {
    try {
      const results = await this.processLeads();
      console.log('Lead scoring results:', results);
    } catch (error) {
      console.error('Lead scoring failed:', error);
    }
  }
}

// Run the lead scorer
if (require.main === module) {
  const leadScorer = new LeadScorer();
  leadScorer.run().catch(console.error);
}

module.exports = { LeadScorer }; 