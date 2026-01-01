# Authentication Guide

This document describes the authentication system implemented in the Leader platform.

## Overview

The Leader platform uses Supabase Authentication with support for multiple authentication methods:
- Email/Password authentication
- Magic Link (passwordless) authentication
- Password reset functionality

## Authentication Pages

### Login (`/auth/login`)
- **Email/Password Login**: Traditional email and password authentication
- **Magic Link Login**: Passwordless authentication via email link
- Toggle between password and magic link modes
- Automatic redirect to dashboard after successful authentication
- Link to password reset and signup pages

### Signup (`/auth/signup`)
- Email and password registration
- Optional full name field
- Password strength indicator
- Password confirmation validation
- Automatic user profile creation in the database
- Email verification required (handled by Supabase)

### Reset Password (`/auth/reset-password`)
- Request password reset via email
- Sends reset link to user's email
- Link expires after 1 hour

### Update Password (`/auth/update-password`)
- Updates password after clicking reset link
- Validates password strength
- Requires password confirmation
- Automatic redirect to dashboard after successful update

### Auth Callback (`/auth/callback`)
- Handles OAuth and magic link callbacks
- Automatically creates user profile if needed
- Redirects to dashboard after successful authentication

## User Profile Management

### Automatic Profile Creation
When a user signs up or logs in, the system automatically:
1. Creates an entry in the `users` table if it doesn't exist
2. Sets default subscription status to `trial`
3. Sets default subscription plan to `basic`
4. Stores user email and optional full name

### Profile Utilities
Located in `lib/auth.ts`:
- `ensureUserProfile()`: Ensures a user profile exists, creates one if needed
- `getUserProfile()`: Retrieves user profile from the database

## Protected Routes

### Dashboard Protection
The dashboard (`/dashboard`) automatically:
- Redirects unauthenticated users to `/auth/login`
- Ensures user profile exists before loading
- Displays user email in navigation
- Provides sign out functionality

### Route Protection Hook
`lib/useAuth.ts` provides a `useRequireAuth()` hook for protecting routes:
```typescript
const { session, loading } = useRequireAuth('/auth/login')
```

## Authentication Flow

### Sign Up Flow
1. User visits `/auth/signup`
2. Enters email, password, and optional name
3. System creates Supabase auth user
4. System creates user profile in `users` table
5. User receives verification email
6. After verification, user can log in

### Login Flow (Password)
1. User visits `/auth/login`
2. Selects "Password" mode
3. Enters email and password
4. System authenticates via Supabase
5. System ensures user profile exists
6. User redirected to dashboard

### Login Flow (Magic Link)
1. User visits `/auth/login`
2. Selects "Magic Link" mode
3. Enters email address
4. System sends magic link email
5. User clicks link in email
6. System authenticates and redirects to dashboard

### Password Reset Flow
1. User visits `/auth/reset-password`
2. Enters email address
3. System sends password reset email
4. User clicks reset link
5. User redirected to `/auth/update-password`
6. User enters new password
7. Password updated and user redirected to dashboard

## Environment Variables

Required Supabase environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Configuration

### Required Settings
1. **Email Authentication**: Enabled
2. **Magic Link**: Enabled
3. **Email Templates**: Configured for:
   - Magic Link
   - Password Reset
   - Email Verification

### Redirect URLs
Configure these redirect URLs in Supabase Dashboard:
- `http://localhost:3000/dashboard` (development)
- `https://yourdomain.com/dashboard` (production)
- `http://localhost:3000/auth/update-password` (password reset)
- `https://yourdomain.com/auth/update-password` (password reset)

## Database Schema

### Users Table
The `users` table stores user profiles:
- `id`: UUID (references auth.users)
- `email`: TEXT (unique)
- `full_name`: TEXT (optional)
- `subscription_status`: TEXT (default: 'trial')
- `subscription_plan`: TEXT (default: 'basic')
- `subscription_end_date`: TIMESTAMP (optional)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## Security Features

1. **Password Requirements**: Minimum 8 characters
2. **Password Strength Indicator**: Visual feedback during signup
3. **Email Verification**: Required for new accounts
4. **Secure Token Handling**: Auth tokens handled securely via Supabase
5. **Row Level Security**: Database RLS policies protect user data
6. **Session Management**: Handled automatically by Supabase

## Error Handling

All authentication pages include:
- Clear error messages for failed operations
- Success messages for completed actions
- Loading states during async operations
- Validation feedback for form inputs

## Testing Authentication

### Test Sign Up
1. Navigate to `/auth/signup`
2. Enter test email and password
3. Check email for verification link
4. Verify account
5. Log in with credentials

### Test Magic Link
1. Navigate to `/auth/login`
2. Select "Magic Link" tab
3. Enter email
4. Check email for magic link
5. Click link to authenticate

### Test Password Reset
1. Navigate to `/auth/reset-password`
2. Enter registered email
3. Check email for reset link
4. Click link and update password
5. Log in with new password

## Troubleshooting

### Common Issues

**"User already registered"**
- User exists in Supabase auth but profile creation failed
- Profile will be created automatically on next login

**"Invalid reset link"**
- Reset links expire after 1 hour
- Request a new reset link

**"Email not verified"**
- Check spam folder for verification email
- Request new verification email from Supabase dashboard

**Redirect loops**
- Check Supabase redirect URL configuration
- Verify environment variables are set correctly

## Future Enhancements

Potential improvements:
- Social authentication (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Remember me functionality
- Session timeout handling
- Account deletion
- Profile editing

