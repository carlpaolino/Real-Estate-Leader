const sgMail = require('@sendgrid/mail');
const Airtable = require('airtable');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configure services
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Per-plan weekly lead allowance. Keep in sync with PLANS in lib/stripe.ts.
const PLAN_WEEKLY_LEADS = {
  basic: 5,
  pro: 15,
};
const DEFAULT_WEEKLY_LEADS = 5;

class WeeklyReportSender {
  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
  }

  async getActiveUsers() {
    try {
      // Include `trialing` and `past_due` so we don't accidentally cut off
      // paying customers mid-cycle. `subscription_plan` is needed for limits.
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, subscription_status, subscription_plan')
        .in('subscription_status', ['active', 'trialing']);

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching active users:', error);
      return [];
    }
  }

  getWeeklyLeadLimit(user) {
    const plan = (user && user.subscription_plan) || 'basic';
    return PLAN_WEEKLY_LEADS[plan] || DEFAULT_WEEKLY_LEADS;
  }

  async getCuratedLeads(userId, limit = 5) {
    try {
      // Get leads that haven't been delivered to this user yet
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .eq('delivered', false)
        .gte('score', 60) // Only high-scoring leads
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return leads || [];
    } catch (error) {
      console.error('Error fetching curated leads:', error);
      return [];
    }
  }

  async markLeadsAsDelivered(leadIds) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ delivered: true, delivered_at: new Date().toISOString() })
        .in('id', leadIds);

      if (error) throw error;
      console.log(`Marked ${leadIds.length} leads as delivered`);
    } catch (error) {
      console.error('Error marking leads as delivered:', error);
    }
  }

  generateEmailContent(leads, userEmail) {
    const leadHtml = leads.map(lead => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">${lead.owner_name}</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${lead.address}</p>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 12px;">Score: <strong style="color: ${lead.score >= 80 ? '#059669' : lead.score >= 60 ? '#d97706' : '#dc2626'}">${lead.score}</strong></span>
          <span style="color: #6b7280; font-size: 12px;">${lead.foreclosure_type}</span>
        </div>
        ${lead.phone ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">📞 ${lead.phone}</p>` : ''}
        ${lead.email ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">📧 ${lead.email}</p>` : ''}
        <div style="margin-top: 8px;">
          ${Object.entries(lead.signals || {}).map(([signal, active]) => 
            active ? `<span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px;">${signal.replace('_', ' ')}</span>` : ''
          ).join('')}
        </div>
      </div>
    `).join('');

    return {
      subject: `Your Weekly Leader Report - ${leads.length} New Leads`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Leader Weekly Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Leader</h1>
            <p style="color: #6b7280; margin: 8px 0;">Your Weekly Real Estate Lead Report</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #111827;">This Week's Curated Leads</h2>
            <p style="margin: 0; color: #6b7280;">
              We've found ${leads.length} high-quality leads for you this week. 
              These homeowners are pre-foreclosure and likely motivated to sell.
            </p>
          </div>
          
          ${leadHtml}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View All Leads
            </a>
            <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
              Questions? Reply to this email or contact support@leader.com
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Leader Weekly Report

This Week's Curated Leads

${leads.map(lead => `
${lead.owner_name}
${lead.address}
Score: ${lead.score} | Type: ${lead.foreclosure_type}
${lead.phone ? `Phone: ${lead.phone}` : ''}
${lead.email ? `Email: ${lead.email}` : ''}
Signals: ${Object.entries(lead.signals || {}).filter(([, active]) => active).map(([signal]) => signal.replace('_', ' ')).join(', ')}
`).join('\n')}

View all leads: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard
      `
    };
  }

  async sendWeeklyReport() {
    console.log('Starting weekly report generation...');
    
    const users = await this.getActiveUsers();
    console.log(`Found ${users.length} active users`);

    let emailsSent = 0;
    let totalLeadsDelivered = 0;

    for (const user of users) {
      try {
        const weeklyLimit = this.getWeeklyLeadLimit(user);
        console.log(`Processing user: ${user.email} (plan: ${user.subscription_plan || 'basic'}, limit: ${weeklyLimit})`);

        // Get curated leads for this user, capped to their plan's allowance
        const leads = await this.getCuratedLeads(user.id, weeklyLimit);

        if (leads.length === 0) {
          console.log(`No leads available for ${user.email}`);
          continue;
        }

        // Generate email content
        const emailContent = this.generateEmailContent(leads, user.email);
        
        // Send email
        const msg = {
          to: user.email,
          from: this.fromEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        };

        await sgMail.send(msg);
        
        // Mark leads as delivered
        await this.markLeadsAsDelivered(leads.map(lead => lead.id));
        
        emailsSent++;
        totalLeadsDelivered += leads.length;
        
        console.log(`Sent ${leads.length} leads to ${user.email}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error sending report to ${user.email}:`, error);
      }
    }

    console.log(`Weekly report completed. Emails sent: ${emailsSent}, Total leads delivered: ${totalLeadsDelivered}`);
    return { emailsSent, totalLeadsDelivered };
  }

  async run() {
    try {
      const results = await this.sendWeeklyReport();
      console.log('Weekly report results:', results);
    } catch (error) {
      console.error('Weekly report failed:', error);
    }
  }
}

// Run the weekly report sender
if (require.main === module) {
  const weeklyReportSender = new WeeklyReportSender();
  weeklyReportSender.run().catch(console.error);
}

module.exports = { WeeklyReportSender }; 