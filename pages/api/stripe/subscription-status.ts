import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = req.query.userId as string

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan, subscription_end_date, stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      status: user.subscription_status,
      plan: user.subscription_plan,
      endDate: user.subscription_end_date,
      hasSubscription: !!user.stripe_subscription_id,
    })
  } catch (error: any) {
    console.error('Error fetching subscription status:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

