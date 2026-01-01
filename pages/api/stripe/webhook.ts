import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Get subscription from session
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = subscription.customer as string

  // Update user in database
  await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_plan: planId,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id
  let planId = 'basic'
  
  // Map price IDs to plan IDs
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    planId = 'basic'
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    planId = 'pro'
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    planId = 'enterprise'
  }

  const status = subscription.status === 'active' ? 'active' : 
                 subscription.status === 'trialing' ? 'trial' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'inactive'

  await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  await supabase
    .from('users')
    .update({
      subscription_status: 'canceled',
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await handleSubscriptionUpdate(subscription)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const customerId = invoice.customer as string

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (user) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', user.id)
  }
}

