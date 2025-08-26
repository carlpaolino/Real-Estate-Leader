const puppeteer = require('puppeteer');
const Airtable = require('airtable');
const axios = require('axios');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class ForeclosureScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async scrapeCountyData(county, config) {
    console.log(`Starting scrape for ${county.name}...`);
    
    try {
      await this.page.goto(config.url, { waitUntil: 'networkidle2' });
      
      // Wait for the page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract foreclosure data based on county-specific selectors
      const foreclosureData = await this.page.evaluate((selectors) => {
        const rows = document.querySelectorAll(selectors.rowSelector);
        const data = [];
        
        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header row
          
          const cells = row.querySelectorAll('td');
          if (cells.length >= selectors.minColumns) {
            const record = {
              address: cells[selectors.addressIndex]?.textContent?.trim() || '',
              owner_name: cells[selectors.ownerIndex]?.textContent?.trim() || '',
              foreclosure_type: cells[selectors.typeIndex]?.textContent?.trim() || '',
              filing_date: cells[selectors.dateIndex]?.textContent?.trim() || '',
              county: county.name,
              scraped_at: new Date().toISOString()
            };
            
            if (record.address && record.owner_name) {
              data.push(record);
            }
          }
        });
        
        return data;
      }, config.selectors);
      
      console.log(`Found ${foreclosureData.length} records for ${county.name}`);
      return foreclosureData;
      
    } catch (error) {
      console.error(`Error scraping ${county.name}:`, error);
      return [];
    }
  }

  async saveToAirtable(data, tableName) {
    try {
      const records = data.map(record => ({
        fields: record
      }));
      
      // Split into chunks of 10 to avoid Airtable limits
      const chunks = [];
      for (let i = 0; i < records.length; i += 10) {
        chunks.push(records.slice(i, i + 10));
      }
      
      let totalCreated = 0;
      for (const chunk of chunks) {
        const result = await base(tableName).create(chunk);
        totalCreated += result.length;
      }
      
      console.log(`Successfully saved ${totalCreated} records to Airtable`);
      return totalCreated;
      
    } catch (error) {
      console.error('Error saving to Airtable:', error);
      return 0;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// County configurations
const countyConfigs = {
  'Los Angeles': {
    url: 'https://www.lacounty.gov/foreclosure/',
    selectors: {
      rowSelector: 'table tbody tr',
      minColumns: 4,
      addressIndex: 0,
      ownerIndex: 1,
      typeIndex: 2,
      dateIndex: 3
    }
  },
  'Orange County': {
    url: 'https://www.ocgov.com/gov/assessor/foreclosure',
    selectors: {
      rowSelector: '.foreclosure-table tr',
      minColumns: 4,
      addressIndex: 0,
      ownerIndex: 1,
      typeIndex: 2,
      dateIndex: 3
    }
  }
  // Add more counties as needed
};

async function main() {
  const scraper = new ForeclosureScraper();
  
  try {
    await scraper.initialize();
    
    const allData = [];
    
    // Scrape each county
    for (const [countyName, config] of Object.entries(countyConfigs)) {
      const countyData = await scraper.scrapeCountyData(
        { name: countyName },
        config
      );
      
      allData.push(...countyData);
      
      // Add delay between counties to be respectful
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Save to Airtable
    if (allData.length > 0) {
      await scraper.saveToAirtable(allData, 'Raw Foreclosure Data');
    }
    
    console.log(`Scraping completed. Total records: ${allData.length}`);
    
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run the scraper
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ForeclosureScraper, countyConfigs }; 