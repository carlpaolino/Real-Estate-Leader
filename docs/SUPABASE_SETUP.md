# Complete Supabase Setup Guide

This guide will walk you through connecting your Leader app to Supabase to fix the "failed to fetch" error.

## Step 1: Create/Verify Your Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create an account

2. **Create a New Project** (if you don't have one)
   - Click "New Project"
   - Choose your organization
   - Enter project name: `Real-Estate-Leader` (or any name)
   - Enter a database password (save this securely!)
   - Select a region closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for project to initialize

3. **Get Your Project Credentials**
   - Once project is ready, go to **Settings** → **API**
   - You'll see:
     - **Project URL**: `https://xxxxx.supabase.co` (where xxxxx is your project ref)
     - **anon/public key**: A long JWT token starting with `eyJ...`
     - **service_role key**: Another JWT token (keep this secret!)

## Step 2: Update Environment Variables

1. **Open your `.env.local` file** in the project root

2. **Update these values** with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_dashboard
```

**Important Notes:**
- Replace `YOUR_PROJECT_REF` with your actual project reference ID
- The URL should look like: `https://abcdefghijklmnop.supabase.co`
- Copy the keys exactly as shown (they're long JWT tokens)
- Make sure there are no extra spaces or quotes

## Step 3: Configure Supabase Authentication

1. **Go to Authentication Settings**
   - In Supabase Dashboard: **Authentication** → **Providers**

2. **Enable Email Provider**
   - Make sure "Email" is enabled
   - Under "Email Auth", ensure:
     - ✅ "Enable email signup" is ON
     - ✅ "Confirm email" - You can turn this OFF for testing, or leave ON for production
     - ✅ "Secure email change" - Leave ON

3. **Configure Email Templates** (Optional but recommended)
   - Go to **Authentication** → **Email Templates**
   - Customize templates if needed, or use defaults

4. **Set Redirect URLs**
   - Go to **Authentication** → **URL Configuration**
   - Add these to "Redirect URLs":
     ```
     http://localhost:3000/dashboard
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/update-password
     ```
   - For production, also add:
     ```
     https://yourdomain.com/dashboard
     https://yourdomain.com/auth/callback
     https://yourdomain.com/auth/update-password
     ```

## Step 4: Set Up Database Tables

1. **Open SQL Editor**
   - In Supabase Dashboard: **SQL Editor** → **New Query**

2. **Run this SQL to create the users table:**

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'basic',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

3. **Click "Run"** to execute the SQL

4. **Verify the table was created:**
   - Go to **Table Editor**
   - You should see the `users` table

## Step 5: Test the Connection

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser console** (F12 or Cmd+Option+I)

3. **Try to sign up:**
   - Go to http://localhost:3000/auth/signup
   - Enter an email and password
   - Click "Create account"

4. **Check for errors:**
   - Look in the browser console for any errors
   - Common issues:
     - "Failed to fetch" → Check your Supabase URL and keys
     - "Invalid API key" → Double-check your anon key
     - "Network error" → Check your internet connection

## Step 6: Troubleshooting "Failed to Fetch" Error

### Check 1: Verify Environment Variables
```bash
# In your terminal, check if variables are loaded:
cd "/Users/carl/Code/Main Side Projects/Real estate bot/Real-Estate-Leader"
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

If this shows `undefined`, your `.env.local` file isn't being read.

### Check 2: Verify Supabase URL Format
Your URL should be:
- ✅ Correct: `https://abcdefghijklmnop.supabase.co`
- ❌ Wrong: `https://Real-Estate-Leader.supabase.co`
- ❌ Wrong: `https://your-project.supabase.co`

The project reference is a random string, not your project name!

### Check 3: Test Supabase Connection Directly
Create a test file `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)

const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('✅ Connection successful!')
    }
  })
```

Run it:
```bash
node test-supabase.js
```

### Check 4: CORS Issues
If you're still getting "Failed to fetch":
1. Make sure you're using `NEXT_PUBLIC_` prefix for client-side variables
2. Check Supabase Dashboard → Settings → API → CORS settings
3. Make sure `http://localhost:3000` is allowed

### Check 5: Network/Firewall
- Disable VPN if you're using one
- Check if your firewall is blocking connections
- Try accessing Supabase dashboard in the same browser

## Step 7: Verify Everything Works

After fixing the connection:

1. **Sign Up Test:**
   - Go to `/auth/signup`
   - Create an account
   - Check Supabase Dashboard → Authentication → Users
   - You should see your new user

2. **Login Test:**
   - Go to `/auth/login`
   - Sign in with your credentials
   - You should be redirected to `/dashboard`

3. **Database Test:**
   - After signing up, check Supabase Dashboard → Table Editor → users
   - You should see a row with your user ID and email

## Common Issues and Solutions

### Issue: "Invalid API key"
**Solution:** Copy the anon key again from Supabase Dashboard → Settings → API

### Issue: "Failed to fetch" or Network Error
**Solutions:**
- Verify your Supabase URL is correct (check project reference ID)
- Make sure `.env.local` is in the project root
- Restart your dev server after changing `.env.local`
- Check browser console for detailed error messages

### Issue: "User already registered"
**Solution:** This is normal if you've tried signing up before. Try logging in instead, or use a different email.

### Issue: "Email not confirmed"
**Solution:** 
- Check your email (including spam folder) for verification link
- Or disable email confirmation in Supabase Dashboard → Authentication → Providers → Email → "Confirm email" OFF

## Next Steps

Once authentication is working:
1. Set up the remaining database tables (leads, outreach_logs, etc.)
2. Configure email templates
3. Set up production redirect URLs
4. Test the full authentication flow

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify all environment variables are set correctly
4. Make sure your Supabase project is active (not paused)

