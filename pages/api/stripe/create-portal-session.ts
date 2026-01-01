import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' })
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.headers.origin}/dashboard`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

