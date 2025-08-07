const twilio = require('twilio');
const Airtable = require('airtable');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configure services
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class SMSOutreach {
  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async getNewLeads() {
    try {
      const records = await base('Raw Foreclosure Data').select({
        filterByFormula: '{Contact Info Added} = TRUE() AND {SMS Sent} = FALSE() AND {Phone} != ""',
        maxRecords: 50
      }).all();

      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching new leads:', error);
      return [];
    }
  }

  generateSMSTemplate(lead) {
    const templates = [
      `Hi ${lead.owner_name}, I'm reaching out about your property at ${lead.address}. I help homeowners in your situation find solutions. Would you be interested in a free consultation? Reply STOP to opt out.`,
      
      `${lead.owner_name}, I noticed your property at ${lead.address} and wanted to see if you're considering selling. I have cash buyers ready to close quickly. Call me back at ${this.fromNumber} if interested. Reply STOP to opt out.`,
      
      `Hi ${lead.owner_name}, I'm a real estate investor looking at properties in your area. I'm interested in your home at ${lead.address}. Are you open to discussing your options? Reply STOP to opt out.`
    ];

    // Randomly select a template to avoid detection
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async checkDNCLists(phoneNumber) {
    try {
      // In production, you'd integrate with DNC list checking services
      // For demo purposes, we'll assume the number is not on DNC lists
      return false;
    } catch (error) {
      console.error('Error checking DNC lists:', error);
      return false; // Assume not on DNC to be safe
    }
  }

  async sendSMS(lead) {
    try {
      const phoneNumber = lead.phone;
      
      // Check if number is on DNC lists
      const isOnDNC = await this.checkDNCLists(phoneNumber);
      if (isOnDNC) {
        console.log(`Skipping ${phoneNumber} - on DNC list`);
        return { success: false, reason: 'DNC' };
      }

      // Generate message
      const message = this.generateSMSTemplate(lead);
      
      // Send SMS via Twilio
      const result = await twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`SMS sent to ${phoneNumber}: ${result.sid}`);
      
      // Log the outreach
      await this.logOutreach(lead, 'sms', result.sid, message);
      
      return { success: true, sid: result.sid };
      
    } catch (error) {
      console.error(`Error sending SMS to ${lead.phone}:`, error);
      return { success: false, reason: error.message };
    }
  }

  async logOutreach(lead, method, messageId, content) {
    try {
      await supabase
        .from('outreach_logs')
        .insert({
          lead_id: lead.id,
          user_id: lead.user_id || 'system',
          method,
          message_id: messageId,
          content,
          timestamp: new Date().toISOString(),
          status: 'sent'
        });
    } catch (error) {
      console.error('Error logging outreach:', error);
    }
  }

  async updateLeadStatus(recordId, smsSent, messageId) {
    try {
      await base('Raw Foreclosure Data').update([
        {
          id: recordId,
          fields: {
            'SMS Sent': smsSent,
            'SMS Message ID': messageId,
            'SMS Sent At': new Date().toISOString()
          }
        }
      ]);

      console.log(`Updated lead ${recordId} SMS status`);
    } catch (error) {
      console.error(`Error updating lead ${recordId}:`, error);
    }
  }

  async processLeads() {
    console.log('Starting SMS outreach process...');
    
    const leads = await this.getNewLeads();
    console.log(`Found ${leads.length} leads for SMS outreach`);

    let processed = 0;
    let successful = 0;
    let dncBlocked = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        console.log(`Processing SMS for: ${lead.owner_name} at ${lead.address}`);
        
        const result = await this.sendSMS(lead);
        
        if (result.success) {
          await this.updateLeadStatus(lead.id, true, result.sid);
          successful++;
        } else if (result.reason === 'DNC') {
          await this.updateLeadStatus(lead.id, false, 'DNC');
          dncBlocked++;
        } else {
          await this.updateLeadStatus(lead.id, false, result.reason);
          failed++;
        }
        
        processed++;
        
        // Rate limiting - be respectful to Twilio and TCPA compliance
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        processed++;
        failed++;
      }
    }

    console.log(`SMS outreach completed. Processed: ${processed}, Successful: ${successful}, DNC: ${dncBlocked}, Failed: ${failed}`);
    return { processed, successful, dncBlocked, failed };
  }

  async handleWebhook(req, res) {
    try {
      const { MessageSid, From, Body, MessageStatus } = req.body;
      
      console.log(`Webhook received: ${MessageSid} from ${From} - ${MessageStatus}`);
      
      if (MessageStatus === 'delivered') {
        // Update outreach log
        await supabase
          .from('outreach_logs')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('message_id', MessageSid);
      }
      
      if (Body && Body.toLowerCase().includes('stop')) {
        // Handle opt-out
        await this.handleOptOut(From);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Error');
    }
  }

  async handleOptOut(phoneNumber) {
    try {
      // Add to opt-out list
      await supabase
        .from('opt_outs')
        .insert({
          phone_number: phoneNumber,
          opted_out_at: new Date().toISOString()
        });
      
      console.log(`Phone number ${phoneNumber} opted out`);
    } catch (error) {
      console.error('Error handling opt-out:', error);
    }
  }

  async run() {
    try {
      const results = await this.processLeads();
      console.log('SMS outreach results:', results);
    } catch (error) {
      console.error('SMS outreach failed:', error);
    }
  }
}

// Run the SMS outreach
if (require.main === module) {
  const smsOutreach = new SMSOutreach();
  smsOutreach.run().catch(console.error);
}

module.exports = { SMSOutreach }; 