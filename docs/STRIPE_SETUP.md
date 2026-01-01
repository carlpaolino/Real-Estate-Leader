# Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe subscriptions for your Leader application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Your Next.js application running
- Supabase database configured

## Step 1: Create Stripe Account and Get API Keys

1. **Sign up for Stripe**
   - Go to https://stripe.com and create an account
   - Complete the account setup process

2. **Get Your API Keys**
   - Go to Stripe Dashboard → **Developers** → **API keys**
   - Copy your **Publishable key** (starts with `pk_test_` for test mode)
   - Copy your **Secret key** (starts with `sk_test_` for test mode)
   - **Important**: Keep your secret key secure and never expose it in client-side code

## Step 2: Create Subscription Products and Prices

1. **Create Products**
   - Go to Stripe Dashboard → **Products**
   - Click **"Add product"** for each plan:
     - **Basic Plan**: $29.99/month
     - **Pro Plan**: $79.99/month
     - **Enterprise Plan**: $199.99/month

2. **Set Up Pricing**
   - For each product, set up a recurring price:
     - Billing period: Monthly
     - Price: Match the prices in `lib/stripe.ts`
     - Copy the **Price ID** (starts with `price_`)

3. **Update Environment Variables**
   - Add the Price IDs to your `.env.local`:
   ```env
   STRIPE_BASIC_PRICE_ID=price_xxxxx
   STRIPE_PRO_PRICE_ID=price_xxxxx
   STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
   ```

## Step 3: Update Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Step 2)
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

## Step 4: Update Database Schema

Run this SQL in your Supabase SQL Editor to add Stripe fields:

```sql
-- Add Stripe columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
```

## Step 5: Set Up Stripe Webhooks

Webhooks are essential for keeping your database in sync with Stripe subscription events.

### For Local Development:

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   
   This will output a webhook signing secret (starts with `whsec_`). Add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### For Production:

1. **Create Webhook Endpoint**
   - Go to Stripe Dashboard → **Developers** → **Webhooks**
   - Click **"Add endpoint"**
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. **Get Webhook Secret**
   - After creating the endpoint, click on it
   - Copy the **Signing secret** (starts with `whsec_`)
   - Add it to your production environment variables

## Step 6: Update Stripe Configuration

Update `lib/stripe.ts` with your actual Price IDs if you haven't already set them in environment variables:

```typescript
export const PLANS = {
  basic: {
    name: 'Basic',
    price: 29.99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_xxxxx',
    // ...
  },
  // ...
}
```

## Step 7: Test the Integration

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Checkout Flow**
   - Log in to your application
   - Navigate to `/subscription`
   - Click "Get Started" on a plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Use any future expiry date, any CVC, any ZIP code

3. **Test Webhook Events**
   - After completing checkout, check your database
   - Verify that `stripe_customer_id` and `stripe_subscription_id` are set
   - Verify that `subscription_status` is `active`

4. **Test Subscription Management**
   - Go to dashboard and click "Manage Subscription"
   - This should open Stripe Customer Portal
   - Test canceling and reactivating subscriptions

## Step 8: Production Checklist

Before going live:

- [ ] Switch Stripe to **Live mode** in dashboard
- [ ] Update environment variables with live API keys
- [ ] Update webhook endpoint URL to production URL
- [ ] Test checkout flow with real card (use a small amount)
- [ ] Verify webhooks are working in production
- [ ] Set up email notifications for failed payments
- [ ] Configure Stripe Customer Portal settings
- [ ] Test subscription cancellation and reactivation

## Common Issues and Solutions

### Issue: "No such price" error
**Solution**: Make sure you've created the prices in Stripe and set the correct Price IDs in environment variables.

### Issue: Webhook signature verification failed
**Solution**: 
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local development, use the secret from `stripe listen` command
- For production, use the secret from your webhook endpoint

### Issue: Subscription status not updating
**Solution**:
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is accessible
- Check server logs for errors
- Ensure database has the correct columns

### Issue: Customer Portal not opening
**Solution**:
- Verify `stripe_customer_id` is set in database
- Check that Stripe Customer Portal is enabled in Stripe Dashboard
- Verify API keys are correct

## Stripe Test Cards

Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

For more test cards, see: https://stripe.com/docs/testing

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

## Support

If you encounter issues:
1. Check Stripe Dashboard → **Developers** → **Logs** for API errors
2. Check your server logs for webhook processing errors
3. Verify all environment variables are set correctly
4. Ensure database schema is up to date

