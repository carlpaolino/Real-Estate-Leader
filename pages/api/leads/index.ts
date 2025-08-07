import { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.setHeader('Set-Cookie', `${name}=${value}`))
        },
      },
    }
  )

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json(leads)
    } catch (error) {
      console.error('Error fetching leads:', error)
      return res.status(500).json({ error: 'Failed to fetch leads' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { address, owner_name, phone, email, foreclosure_type, filing_date, county, score, signals } = req.body

      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          user_id: session.user.id,
          address,
          owner_name,
          phone,
          email,
          foreclosure_type,
          filing_date,
          county,
          score,
          signals,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json(lead)
    } catch (error) {
      console.error('Error creating lead:', error)
      return res.status(500).json({ error: 'Failed to create lead' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
} 