const Airtable = require('airtable');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class SampleDataGenerator {
  constructor() {
    this.rawTable = base('Raw Foreclosure Data');
  }

  generateSampleLeads() {
    const counties = ['Los Angeles', 'Orange County', 'San Diego', 'Riverside', 'San Bernardino'];
    const foreclosureTypes = ['NOD', 'Lis Pendens', 'Auction', 'Tax Sale'];
    const sampleData = [];

    for (let i = 0; i < 20; i++) {
      const county = counties[Math.floor(Math.random() * counties.length)];
      const foreclosureType = foreclosureTypes[Math.floor(Math.random() * foreclosureTypes.length)];
      
      const record = {
        fields: {
          'Address': `${Math.floor(Math.random() * 9999) + 1000} ${this.generateStreetName()} St, ${this.generateCity(county)}, CA`,
          'Owner Name': this.generateName(),
          'Foreclosure Type': foreclosureType,
          'Filing Date': this.generateRandomDate(),
          'County': county,
          'Scraped At': new Date().toISOString().split('T')[0],
          'Contact Info Added': false,
          'Scored': false,
          'Moved to Processed': false
        }
      };
      
      sampleData.push(record);
    }

    return sampleData;
  }

  generateStreetName() {
    const streets = ['Main', 'Oak', 'Pine', 'Elm', 'Maple', 'Cedar', 'Willow', 'Cherry', 'Birch', 'Spruce'];
    return streets[Math.floor(Math.random() * streets.length)];
  }

  generateCity(county) {
    const cities = {
      'Los Angeles': ['Los Angeles', 'Beverly Hills', 'Santa Monica', 'Pasadena', 'Glendale'],
      'Orange County': ['Anaheim', 'Irvine', 'Newport Beach', 'Huntington Beach', 'Costa Mesa'],
      'San Diego': ['San Diego', 'La Jolla', 'Carlsbad', 'Encinitas', 'Del Mar'],
      'Riverside': ['Riverside', 'Corona', 'Moreno Valley', 'Temecula', 'Murrieta'],
      'San Bernardino': ['San Bernardino', 'Ontario', 'Rancho Cucamonga', 'Fontana', 'Redlands']
    };
    
    const cityList = cities[county] || ['Unknown'];
    return cityList[Math.floor(Math.random() * cityList.length)];
  }

  generateName() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Mary'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  generateRandomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }

  async saveToAirtable(data) {
    try {
      // Split into chunks of 10 to avoid Airtable limits
      const chunks = [];
      for (let i = 0; i < data.length; i += 10) {
        chunks.push(data.slice(i, i + 10));
      }
      
      let totalCreated = 0;
      for (const chunk of chunks) {
        const result = await this.rawTable.create(chunk);
        totalCreated += result.length;
        console.log(`Created ${result.length} records`);
      }
      
      console.log(`Successfully created ${totalCreated} sample records in Airtable`);
      return totalCreated;
      
    } catch (error) {
      console.error('Error saving to Airtable:', error);
      return 0;
    }
  }

  async generateSampleData() {
    console.log('Generating sample foreclosure data...');
    
    const sampleData = this.generateSampleLeads();
    console.log(`Generated ${sampleData.length} sample records`);
    
    const created = await this.saveToAirtable(sampleData);
    
    if (created > 0) {
      console.log(`✅ Successfully created ${created} sample records in your Raw Foreclosure Data table`);
      console.log('You can now test your workflow:');
      console.log('1. npm run skip-trace');
      console.log('2. npm run score-leads');
      console.log('3. npm run move-to-processed');
    } else {
      console.log('❌ Failed to create sample data');
    }
  }
}

// Run the generator
if (require.main === module) {
  const generator = new SampleDataGenerator();
  generator.generateSampleData().catch(console.error);
}

module.exports = { SampleDataGenerator };
