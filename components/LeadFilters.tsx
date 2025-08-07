import { LeadFilters } from '@/types/lead'

interface LeadFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
}

export default function LeadFilters({ filters, onFiltersChange }: LeadFiltersProps) {
  const handleFilterChange = (key: keyof LeadFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="responded">Responded</option>
            <option value="offer_made">Offer Made</option>
            <option value="dead_lead">Dead Lead</option>
          </select>
        </div>

        {/* Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Score
          </label>
          <select
            value={filters.score}
            onChange={(e) => handleFilterChange('score', e.target.value)}
            className="input-field"
          >
            <option value="all">All Scores</option>
            <option value="high">High (80+)</option>
            <option value="medium">Medium (60-79)</option>
            <option value="low">Low (&lt;60)</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="input-field"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFiltersChange({
              status: 'all',
              score: 'all',
              dateRange: 'all'
            })}
            className="btn-secondary text-sm"
          >
            Clear Filters
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              status: 'new'
            })}
            className="btn-primary text-sm"
          >
            Show New Only
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              score: 'high'
            })}
            className="btn-primary text-sm"
          >
            High Score Only
          </button>
        </div>
      </div>
    </div>
  )
} 