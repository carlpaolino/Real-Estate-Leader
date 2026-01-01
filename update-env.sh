#!/bin/bash

# Script to help update Supabase credentials in .env.local

echo "🔧 Supabase Configuration Updater"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Creating from env.example..."
    cp env.example .env.local
fi

echo "Please enter your Supabase credentials from:"
echo "https://supabase.com/dashboard → Settings → API"
echo ""

# Get Supabase URL
read -p "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL

# Validate URL format
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo "❌ Invalid URL format! Should be: https://xxxxx.supabase.co"
    exit 1
fi

# Get Anon Key
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Get Service Role Key
read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_KEY

echo ""
echo "Updating .env.local..."

# Update or add SUPABASE_URL
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
else
    echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> .env.local
fi

# Update or add SUPABASE_ANON_KEY
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env.local
else
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env.local
fi

# Update or add SUPABASE_SERVICE_ROLE_KEY
if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY|" .env.local
else
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY" >> .env.local
fi

echo "✅ Updated .env.local!"
echo ""
echo "Testing connection..."
node test-supabase-connection.js

