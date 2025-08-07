import { useEffect, useState } from 'react'
import { useSupabase } from './_app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import LeadCard from '@/components/LeadCard'
import DashboardStats from '@/components/DashboardStats'
import LeadFilters from '@/components/LeadFilters'
import { Lead } from '@/types/lead'

export default function Dashboard({ session }: { session: any }) {
  const supabase = useSupabase()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    score: 'all',
    dateRange: 'all'
  })

  useEffect(() => {
    if (!session) {
      router.push('/')
      return
    }

    fetchLeads()
  }, [session, router])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredLeads = leads.filter(lead => {
    if (filters.status !== 'all' && lead.status !== filters.status) return false
    if (filters.score !== 'all') {
      const score = parseInt(filters.score)
      if (filters.score === 'high' && lead.score < 80) return false
      if (filters.score === 'medium' && (lead.score < 60 || lead.score >= 80)) return false
      if (filters.score === 'low' && lead.score >= 60) return false
    }
    return true
  })

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Dashboard - Leader</title>
        <meta name="description" content="Manage your real estate leads" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Leader</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {session.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-2 text-gray-600">
              Manage your leads and track your progress
            </p>
          </div>

          {/* Stats */}
          <DashboardStats leads={leads} />

          {/* Filters */}
          <div className="mt-8">
            <LeadFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Leads Grid */}
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {leads.length === 0 ? 'You haven\'t received any leads yet.' : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onUpdate={fetchLeads} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 