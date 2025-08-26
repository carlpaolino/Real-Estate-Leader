const Airtable = require('airtable');
require('dotenv').config();

// Configure Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

class CampaignTracker {
  constructor() {
    this.campaignTable = base('Campaign Results');
    this.processedTable = base('Processed Leads');
  }

  async logCampaignResult(leadId, campaignType, messageSent, status = 'Sent') {
    try {
      const record = {
        fields: {
          'Lead ID': [leadId], // Link to Processed Leads
          'Campaign Type': campaignType,
          'Message Sent': messageSent,
          'Sent Date': new Date().toISOString(),
          'Status': status,
          'Outcome': 'No Response' // Default outcome
        }
      };

      const result = await this.campaignTable.create([record]);
      console.log(`Logged campaign result for lead ${leadId}`);
      return result[0];
    } catch (error) {
      console.error(`Error logging campaign result for lead ${leadId}:`, error);
      return null;
    }
  }

  async updateCampaignResult(recordId, responseContent, outcome) {
    try {
      await this.campaignTable.update([
        {
          id: recordId,
          fields: {
            'Response Received': responseContent,
            'Response Date': new Date().toISOString(),
            'Outcome': outcome,
            'Follow Up Required': outcome === 'Interested'
          }
        }
      ]);

      console.log(`Updated campaign result ${recordId}`);
      return true;
    } catch (error) {
      console.error(`Error updating campaign result ${recordId}:`, error);
      return false;
    }
  }

  async handleSMSResponse(phoneNumber, responseContent) {
    try {
      // Find the lead by phone number
      const records = await this.processedTable.select({
        filterByFormula: `{Phone} = "${phoneNumber}"`,
        maxRecords: 1
      }).all();

      if (records.length === 0) {
        console.log(`No lead found for phone number ${phoneNumber}`);
        return;
      }

      const lead = records[0];
      const responseLower = responseContent.toLowerCase();

      // Determine outcome based on response
      let outcome = 'No Response';
      if (responseLower.includes('stop') || responseLower.includes('opt out')) {
        outcome = 'Do Not Contact';
      } else if (responseLower.includes('interested') || responseLower.includes('yes') || responseLower.includes('call')) {
        outcome = 'Interested';
      } else if (responseLower.includes('not interested') || responseLower.includes('no')) {
        outcome = 'Not Interested';
      } else if (responseLower.includes('wrong number')) {
        outcome = 'Wrong Number';
      }

      // Update lead status
      await this.processedTable.update([
        {
          id: lead.id,
          fields: {
            'Status': outcome === 'Interested' ? 'Interested' : 'Contacted',
            'Last Contact Date': new Date().toISOString(),
            'Notes': `SMS Response: ${responseContent}`
          }
        }
      ]);

      // Find and update the campaign result
      const campaignRecords = await this.campaignTable.select({
        filterByFormula: `{Lead ID} = "${lead.id}" AND {Campaign Type} = "SMS"`,
        sort: [{ field: 'Sent Date', direction: 'desc' }],
        maxRecords: 1
      }).all();

      if (campaignRecords.length > 0) {
        await this.updateCampaignResult(campaignRecords[0].id, responseContent, outcome);
      }

      console.log(`Processed SMS response for ${phoneNumber}: ${outcome}`);
    } catch (error) {
      console.error(`Error handling SMS response for ${phoneNumber}:`, error);
    }
  }

  async getFollowUpLeads() {
    try {
      const records = await this.campaignTable.select({
        filterByFormula: '{Follow Up Required} = TRUE() AND {Follow Up Date} = ""',
        maxRecords: 50
      }).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching follow-up leads:', error);
      return [];
    }
  }

  async scheduleFollowUp(recordId, followUpDate) {
    try {
      await this.campaignTable.update([
        {
          id: recordId,
          fields: {
            'Follow Up Date': followUpDate
          }
        }
      ]);

      console.log(`Scheduled follow-up for record ${recordId} on ${followUpDate}`);
      return true;
    } catch (error) {
      console.error(`Error scheduling follow-up for record ${recordId}:`, error);
      return false;
    }
  }

  async generateCampaignReport(startDate, endDate) {
    try {
      const records = await this.campaignTable.select({
        filterByFormula: `IS_AFTER({Sent Date}, "${startDate}") AND IS_BEFORE({Sent Date}, "${endDate}")`,
        maxRecords: 1000
      }).all();

      const stats = {
        total: records.length,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        interested: 0,
        notInterested: 0,
        doNotContact: 0,
        wrongNumber: 0
      };

      records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Status === 'Sent') stats.sent++;
        if (fields.Status === 'Delivered') stats.delivered++;
        if (fields.Status === 'Read') stats.read++;
        if (fields.Status === 'Replied') stats.replied++;
        
        if (fields.Outcome === 'Interested') stats.interested++;
        if (fields.Outcome === 'Not Interested') stats.notInterested++;
        if (fields.Outcome === 'Do Not Contact') stats.doNotContact++;
        if (fields.Outcome === 'Wrong Number') stats.wrongNumber++;
      });

      const conversionRate = stats.total > 0 ? (stats.interested / stats.total * 100).toFixed(2) : 0;

      return {
        period: `${startDate} to ${endDate}`,
        stats,
        conversionRate: `${conversionRate}%`
      };
    } catch (error) {
      console.error('Error generating campaign report:', error);
      return null;
    }
  }
}

// Export for use in other scripts
module.exports = { CampaignTracker };

// Run standalone if called directly
if (require.main === module) {
  const tracker = new CampaignTracker();
  
  // Example: Generate a report for the last 7 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  tracker.generateCampaignReport(startDate, endDate)
    .then(report => {
      if (report) {
        console.log('Campaign Report:', JSON.stringify(report, null, 2));
      }
    })
    .catch(console.error);
}
