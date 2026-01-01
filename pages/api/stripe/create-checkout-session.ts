import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { stripe, PLANS } from '@/lib/stripe'

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
    const { planId, userId } = req.body

    if (!planId || !userId) {
      return res.status(400).json({ error: 'Missing planId or userId' })
    }

    const plan = PLANS[planId as keyof typeof PLANS]
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/subscription`,
      metadata: {
        userId: userId,
        planId: planId,
      },
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

