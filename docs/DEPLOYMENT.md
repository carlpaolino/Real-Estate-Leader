# Leader Platform - Deployment Guide

This guide will help you deploy the Leader real estate lead platform to production.

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Twilio account with a phone number
- A SendGrid account with verified sender email
- An Airtable account and base
- A Google Maps API key
- A domain name (optional but recommended)

## Step 1: Environment Setup

### 1.1 Create Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# SendGrid Configuration (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Optional APIs
SKIP_TRACE_API_KEY=your_skip_trace_api_key
BRIDGE_API_KEY=your_bridge_api_key
```

### 1.2 Supabase Setup

1. Create a new Supabase project
2. Enable authentication with magic link
3. Create the database tables using the schema in `lib/supabase.ts`
4. Set up Row Level Security (RLS) policies
5. Configure email templates for magic link authentication

### 1.3 Airtable Setup

1. Create a new Airtable base
2. Create the following tables:
   - **Raw Foreclosure Data**: For storing scraped data
   - **Processed Leads**: For leads with contact info and scores
   - **Analytics**: For tracking metrics

### 1.4 Twilio Setup

1. Create a Twilio account
2. Purchase a phone number
3. Configure webhook endpoints for SMS delivery status
4. Set up opt-out handling

### 1.5 SendGrid Setup

1. Create a SendGrid account
2. Verify your sender email domain
3. Create email templates for weekly reports
4. Set up webhook endpoints for email tracking

## Step 2: Local Development

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Run Database Migrations

```bash
npm run db:migrate
```

### 2.3 Start Development Server

```bash
npm run dev
```

### 2.4 Test Data Pipeline

```bash
# Test scraping
npm run scrape

# Test skip tracing
npm run skip-trace

# Test lead scoring
npm run score-leads

# Test weekly reports
npm run send-weekly-report
```

## Step 3: Production Deployment

### 3.1 Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy the application

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3.2 Docker Deployment

1. Build the Docker image:

```bash
docker build -t leader .
```

2. Run the container:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  # ... other environment variables
  leader
```

### 3.3 Manual Server Deployment

1. Set up a server with Node.js 18+
2. Clone the repository
3. Install dependencies: `npm install`
4. Build the application: `npm run build`
5. Start the server: `npm start`
6. Set up a reverse proxy (nginx) for SSL

## Step 4: Scheduled Tasks

### 4.1 Set up Cron Jobs

Create cron jobs for automated tasks:

```bash
# Daily scraping (every day at 2 AM)
0 2 * * * cd /path/to/leader && npm run scrape

# Skip tracing (every 6 hours)
0 */6 * * * cd /path/to/leader && npm run skip-trace

# Lead scoring (every 4 hours)
0 */4 * * * cd /path/to/leader && npm run score-leads

# Weekly reports (every Friday at 9 AM)
0 9 * * 5 cd /path/to/leader && npm run send-weekly-report

# SMS outreach (every 2 hours)
0 */2 * * * cd /path/to/leader && npm run send-sms
```

### 4.2 Vercel Cron Jobs

If using Vercel, create API routes for cron jobs:

```typescript
// pages/api/cron/scrape.ts
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Run scraping
  const { ForeclosureScraper } = require('../../../scripts/scraper')
  const scraper = new ForeclosureScraper()
  await scraper.run()
  
  res.status(200).json({ success: true })
}
```

## Step 5: Monitoring and Analytics

### 5.1 Set up Monitoring

1. **Error Tracking**: Use Sentry or similar
2. **Performance Monitoring**: Use Vercel Analytics or Google Analytics
3. **Uptime Monitoring**: Use UptimeRobot or similar
4. **Log Management**: Use LogRocket or similar

### 5.2 Database Monitoring

1. Set up Supabase monitoring
2. Monitor query performance
3. Set up alerts for high usage

### 5.3 API Monitoring

1. Monitor Twilio API usage
2. Track SendGrid delivery rates
3. Monitor Google Maps API usage

## Step 6: Security and Compliance

### 6.1 Security Measures

1. **HTTPS**: Ensure all traffic is encrypted
2. **CORS**: Configure proper CORS policies
3. **Rate Limiting**: Implement API rate limiting
4. **Input Validation**: Validate all user inputs
5. **SQL Injection**: Use parameterized queries

### 6.2 TCPA Compliance

1. **DNC Lists**: Check against Do Not Call lists
2. **Opt-out Mechanism**: Provide easy opt-out options
3. **Consent Management**: Track user consent
4. **Message Content**: Ensure compliant messaging

### 6.3 Data Protection

1. **Encryption**: Encrypt data at rest and in transit
2. **Access Control**: Implement proper access controls
3. **Data Retention**: Set up data retention policies
4. **GDPR Compliance**: Implement GDPR requirements

## Step 7: Testing

### 7.1 Unit Tests

```bash
npm test
```

### 7.2 Integration Tests

Test the complete data pipeline:

```bash
# Test scraping
npm run test:scrape

# Test skip tracing
npm run test:skip-trace

# Test scoring
npm run test:scoring

# Test email delivery
npm run test:email
```

### 7.3 Load Testing

Test the application under load:

```bash
npm run test:load
```

## Step 8: Go-Live Checklist

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Authentication working
- [ ] Data pipeline tested
- [ ] Email templates created
- [ ] SMS templates approved
- [ ] Monitoring configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Cron jobs scheduled
- [ ] Backup strategy implemented
- [ ] Support system ready
- [ ] Documentation updated

## Step 9: Post-Launch

### 9.1 Monitor Performance

- Track lead generation rates
- Monitor user engagement
- Watch for system errors
- Monitor API usage

### 9.2 User Feedback

- Collect user feedback
- Monitor support tickets
- Track feature requests
- Analyze user behavior

### 9.3 Iterate and Improve

- Optimize scoring algorithms
- Improve data quality
- Add new features
- Scale infrastructure

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check Supabase configuration
2. **SMS Delivery Issues**: Verify Twilio credentials
3. **Email Bounces**: Check SendGrid configuration
4. **Database Errors**: Verify schema and permissions
5. **API Rate Limits**: Implement proper rate limiting

### Support

For support, contact:
- Email: support@leader.com
- Documentation: [docs.leader.com](https://docs.leader.com)
- GitHub Issues: [github.com/leader/issues](https://github.com/leader/issues)

## Cost Estimation

### Monthly Costs (Estimated)

- **Supabase**: $25-100/month
- **Twilio**: $50-200/month
- **SendGrid**: $15-50/month
- **Vercel**: $20-100/month
- **Google Maps API**: $10-50/month
- **Airtable**: $10-50/month
- **Monitoring**: $20-100/month

**Total**: $150-550/month

### Scaling Considerations

- **Database**: Consider dedicated database for high volume
- **SMS**: Implement carrier-specific optimizations
- **Email**: Use dedicated IP for high volume
- **Infrastructure**: Consider CDN for global users

---

**Note**: This deployment guide is for the MVP version. For production scaling, consider additional infrastructure, monitoring, and compliance requirements. 