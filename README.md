# Leader - Real Estate Lead Platform

A subscription-based platform that identifies pre-foreclosure homeowners and connects them with real estate investors and agents through curated, high-quality leads.

## 🎯 Overview

Leader is designed to:
- Scrape public foreclosure data from county websites
- Collect owner contact information through skip tracing
- Automatically message homeowners
- Deliver 5 curated leads per week to subscribers
- Provide a dashboard for lead management and tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Twilio account (for SMS)
- SendGrid account (for emails)
- Airtable account (for data storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Real-Estate-Leader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Twilio (SMS)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # SendGrid (Email)
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email

   # Airtable
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id

   # Google Maps (Street View)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # Database
   DATABASE_URL=your_database_url

   # Skip Tracing API (optional)
   SKIP_TRACE_API_KEY=your_skip_trace_api_key
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Real-Estate-Leader/
├── components/          # React components
├── pages/              # Next.js pages
├── scripts/            # Data processing scripts
├── lib/                # Utility functions
├── styles/             # CSS styles
├── public/             # Static assets
└── docs/              # Documentation
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up authentication with magic link enabled
3. Create the following tables:
   - `users` - User profiles and subscription data
   - `leads` - Lead information and status
   - `outreach_logs` - SMS/email outreach tracking
   - `analytics` - User engagement metrics

### Airtable Setup
1. Create a new Airtable base
2. Set up tables for:
   - Raw foreclosure data
   - Processed leads with contact info
   - Scoring data

### Twilio Setup
1. Create a Twilio account
2. Purchase a phone number
3. Configure webhook endpoints for SMS delivery status

### SendGrid Setup
1. Create a SendGrid account
2. Verify your sender email
3. Set up email templates for weekly reports

## 📊 Data Pipeline

### 1. Data Collection
- **Scrapers**: County foreclosure websites
- **Frequency**: Daily
- **Output**: Raw foreclosure data to Airtable

### 2. Skip Tracing
- **Service**: TruePeopleSearch or REISkip API
- **Frequency**: After each new lead
- **Output**: Contact information appended to leads

### 3. Lead Scoring
- **Algorithm**: Weighted scoring based on signals
- **Frequency**: After skip tracing
- **Output**: Sell probability score (0-100)

### 4. Lead Delivery
- **Method**: Weekly email + dashboard
- **Frequency**: Every Friday at 9 AM ET
- **Output**: 5 curated leads per user

## 🎯 Key Features

### MVP Features (Phase 1)
- [x] Data scraping from county websites
- [x] Skip tracing integration
- [x] Lead scoring algorithm
- [x] Basic dashboard
- [x] Magic link authentication
- [x] Weekly email reports
- [x] SMS outreach automation

### Production Features (Phase 2)
- [ ] Subscription payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Multi-county expansion
- [ ] Advanced scoring models
- [ ] CRM integration

## 🔒 Security & Compliance

- All PII encrypted at rest (AES-256)
- TCPA compliance for SMS outreach
- DNC list checking
- GDPR-compliant data handling
- SOC 2 Type II compliance (planned)

## 📈 Success Metrics

### MVP Targets (Tester Month)
- Homeowner response rate: ≥15%
- User subscription intent: ≥30%
- Lead delivery consistency: 5±1 per week
- Data accuracy: ≥85%
- Dashboard engagement: ≥70% WAU

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t leader .
docker run -p 3000:3000 leader
```

## 📝 API Documentation

### Authentication
- Magic link email authentication
- JWT tokens for API access
- Role-based access control

### Endpoints
- `GET /api/leads` - Get user's leads
- `POST /api/leads/:id/status` - Update lead status
- `POST /api/outreach/sms` - Send SMS
- `GET /api/analytics` - Get user analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email support@leader.com or create an issue in this repository.

---

**Leader** - Transforming real estate lead generation through data-driven insights and automated outreach.