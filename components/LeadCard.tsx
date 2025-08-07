import { useState } from 'react'
import { useSupabase } from '@/pages/_app'
import { Lead } from '@/types/lead'
import Image from 'next/image'

interface LeadCardProps {
  lead: Lead
  onUpdate: () => void
}

export default function LeadCard({ lead, onUpdate }: LeadCardProps) {
  const supabase = useSupabase()
  const [updating, setUpdating] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(lead.notes || '')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'badge-info'
      case 'contacted':
        return 'badge-warning'
      case 'responded':
        return 'badge-success'
      case 'offer_made':
        return 'badge-success'
      case 'dead_lead':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-danger-600'
  }

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating lead status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateNotes = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error
      setShowNotes(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const handleContact = async (method: 'phone' | 'email') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: 'contacted',
          last_contacted: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      // Log the outreach
      await supabase
        .from('outreach_logs')
        .insert({
          lead_id: lead.id,
          user_id: lead.user_id,
          method,
          timestamp: new Date().toISOString()
        })

      onUpdate()

      // Open contact method
      if (method === 'phone' && lead.phone) {
        window.open(`tel:${lead.phone}`, '_blank')
      } else if (method === 'email' && lead.email) {
        window.open(`mailto:${lead.email}`, '_blank')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  return (
    <div className="card p-6 hover:shadow-medium transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {lead.owner_name}
          </h3>
          <p className="text-sm text-gray-600">{lead.address}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`badge ${getStatusColor(lead.status)}`}>
            {lead.status.replace('_', ' ')}
          </span>
          <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
            {lead.score}
          </span>
        </div>
      </div>

      {/* Property Image */}
      {lead.street_view_url && (
        <div className="mb-4">
          <Image
            src={lead.street_view_url}
            alt={`Street view of ${lead.address}`}
            width={300}
            height={200}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Foreclosure Type:</span>
          <span className="font-medium">{lead.foreclosure_type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Filing Date:</span>
          <span className="font-medium">
            {new Date(lead.filing_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">County:</span>
          <span className="font-medium">{lead.county}</span>
        </div>
        {lead.property_value && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Property Value:</span>
            <span className="font-medium">
              ${lead.property_value.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      {(lead.phone || lead.email) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Info</h4>
          <div className="space-y-1">
            {lead.phone && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium">{lead.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signals */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Signals</h4>
        <div className="flex flex-wrap gap-1">
          {Object.entries(lead.signals).map(([signal, active]) => (
            active && (
              <span key={signal} className="badge badge-info text-xs">
                {signal.replace('_', ' ')}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Status Update */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Update Status
          </label>
          <select
            value={lead.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="input-field text-sm"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="responded">Responded</option>
            <option value="offer_made">Offer Made</option>
            <option value="dead_lead">Dead Lead</option>
          </select>
        </div>

        {/* Contact Actions */}
        <div className="flex space-x-2">
          {lead.phone && (
            <button
              onClick={() => handleContact('phone')}
              className="btn-primary flex-1 text-sm"
            >
              Call
            </button>
          )}
          {lead.email && (
            <button
              onClick={() => handleContact('email')}
              className="btn-secondary flex-1 text-sm"
            >
              Email
            </button>
          )}
        </div>

        {/* Notes */}
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="btn-secondary w-full text-sm"
          >
            {showNotes ? 'Hide Notes' : 'Add Notes'}
          </button>
          {showNotes && (
            <div className="mt-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                className="input-field text-sm"
                rows={3}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={updateNotes}
                  className="btn-primary text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 