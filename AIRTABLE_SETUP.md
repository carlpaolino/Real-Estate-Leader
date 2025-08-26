# Airtable Setup Guide

## Required Fields for Each Table

### 1. Raw Foreclosure Data Table

**Required Fields:**
- `Address` (Single line text)
- `Owner Name` (Single line text) 
- `Foreclosure Type` (Single line text)
- `Filing Date` (Date)
- `County` (Single line text)
- `Scraped At` (Date)
- `Phone` (Phone number)
- `Email` (Email)
- `Alternate Address` (Single line text)
- `Contact Info Added` (Checkbox)
- `Skip Traced At` (Date)
- `Score` (Number)
- `Signals` (Long text)
- `Property Value` (Currency)
- `Equity Percentage` (Number)
- `Ownership Years` (Number)
- `Street View URL` (URL)
- `Scored` (Checkbox)
- `Scored At` (Date)
- `Moved to Processed` (Checkbox) - **ADD THIS FIELD**
- `Moved At` (Date) - **ADD THIS FIELD**

### 2. Processed Leads Table

**Required Fields:**
- `Lead ID` (Link to Raw Foreclosure Data)
- `Address` (Single line text)
- `Owner Name` (Single line text)
- `Phone` (Phone number)
- `Email` (Email)
- `Score` (Number)
- `Property Value` (Currency)
- `Equity Percentage` (Number)
- `Signals` (Long text)
- `Status` (Single select: "New", "Contacted", "Interested", "Not Interested", "Sold")
- `Campaign Status` (Single select: "Not Started", "SMS Sent", "Email Sent", "Follow Up Needed")
- `Last Contact Date` (Date)
- `Next Follow Up` (Date)
- `Notes` (Long text)
- `Processed At` (Date)
- `SMS Message ID` (Single line text)

### 3. Campaign Results Table

**Required Fields:**
- `Lead ID` (Link to Processed Leads)
- `Campaign Type` (Single select: "SMS", "Email", "Direct Mail", "Phone")
- `Message Sent` (Long text)
- `Response Received` (Long text)
- `Sent Date` (Date)
- `Response Date` (Date)
- `Status` (Single select: "Sent", "Delivered", "Read", "Replied", "Failed")
- `Outcome` (Single select: "No Response", "Interested", "Not Interested", "Wrong Number", "Do Not Contact")
- `Follow Up Required` (Checkbox)
- `Follow Up Date` (Date)
- `Notes` (Long text)

## Views to Create

### Raw Foreclosure Data Views:
1. **All Records** (default)
2. **New Leads** - Filter: `Contact Info Added` = FALSE()
3. **Ready to Score** - Filter: `Contact Info Added` = TRUE() AND `Scored` = FALSE()
4. **Scored** - Filter: `Scored` = TRUE()
5. **High Priority** - Filter: `Score` >= 70

### Processed Leads Views:
1. **All Leads** (default)
2. **New** - Filter: `Status` = "New"
3. **High Priority** - Filter: `Score` >= 70
4. **Follow Up Needed** - Filter: `Next Follow Up` is not empty

### Campaign Results Views:
1. **All Campaigns** (default)
2. **Recent Activity** - Filter: `Sent Date` is within last 7 days
3. **Needs Follow Up** - Filter: `Follow Up Required` = TRUE()

## Workflow

1. **Scraper** → Populates "Raw Foreclosure Data"
2. **Skip Tracer** → Adds contact info to "Raw Foreclosure Data"
3. **Lead Scorer** → Scores leads in "Raw Foreclosure Data"
4. **Move to Processed** → Moves scored leads to "Processed Leads"
5. **SMS Campaign** → Sends outreach from "Processed Leads"
6. **Campaign Tracker** → Logs results in "Campaign Results"

## Scripts to Run

```bash
# 1. Scrape new data
npm run scrape

# 2. Add contact info
npm run skip-trace

# 3. Score leads
npm run score-leads

# 4. Move to processed table
npm run move-to-processed

# 5. Send SMS campaigns
npm run send-sms

# 6. Track campaign results
npm run track-campaign

# 7. Generate reports
npm run send-weekly-report
```

## Environment Variables Needed

Make sure your `.env` file has:
```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
GOOGLE_MAPS_API_KEY=your_google_maps_key
BRIDGE_API_KEY=your_bridge_api_key
SKIP_TRACE_API_KEY=your_skip_trace_key
```
