export interface Lead {
  id: string
  user_id: string
  address: string
  owner_name: string
  phone?: string
  email?: string
  foreclosure_type: 'NOD' | 'Lis Pendens' | 'Auction' | 'Tax Sale'
  filing_date: string
  score: number
  status: 'new' | 'contacted' | 'responded' | 'offer_made' | 'dead_lead'
  notes?: string
  street_view_url?: string
  county: string
  property_value?: number
  equity_percentage?: number
  created_at: string
  updated_at: string
  last_contacted?: string
  response_received?: boolean
  signals: {
    pre_foreclosure: boolean
    vacant: boolean
    code_violations: boolean
    probate: boolean
    divorce: boolean
    long_term_ownership: boolean
    expired_listing: boolean
  }
}

export interface LeadFilters {
  status: 'all' | 'new' | 'contacted' | 'responded' | 'offer_made' | 'dead_lead'
  score: 'all' | 'high' | 'medium' | 'low'
  dateRange: 'all' | 'week' | 'month' | 'quarter'
}

export interface DashboardStats {
  totalLeads: number
  newLeads: number
  contactedLeads: number
  respondedLeads: number
  offerMadeLeads: number
  averageScore: number
  responseRate: number
} 