import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SubscriptionStatusProps {
  userId: string
}

export default function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [userId])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/stripe/subscription-status?userId=${userId}`)
      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error)
      alert(error.message || 'Failed to open subscription management. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const isActive = subscriptionStatus?.status === 'active' || subscriptionStatus?.status === 'trialing'
  const isTrial = subscriptionStatus?.status === 'trial'
  const isPastDue = subscriptionStatus?.status === 'past_due'
  const isCanceled = subscriptionStatus?.status === 'canceled'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Status</h3>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : isTrial
                  ? 'bg-blue-100 text-blue-800'
                  : isPastDue
                  ? 'bg-yellow-100 text-yellow-800'
                  : isCanceled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {subscriptionStatus?.status === 'trialing' ? 'Trial' : 
               subscriptionStatus?.status === 'active' ? 'Active' :
               subscriptionStatus?.status === 'past_due' ? 'Past Due' :
               subscriptionStatus?.status === 'canceled' ? 'Canceled' :
               subscriptionStatus?.status === 'trial' ? 'Trial' : 'Inactive'}
            </span>
            {subscriptionStatus?.plan && (
              <span className="text-sm text-gray-600 capitalize">
                {subscriptionStatus.plan} Plan
              </span>
            )}
            {subscriptionStatus?.endDate && isActive && (
              <span className="text-sm text-gray-500">
                Renews {new Date(subscriptionStatus.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isActive && !isTrial && (
            <Link href="/subscription" className="btn-primary text-sm">
              Subscribe
            </Link>
          )}
          {isActive && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="btn-secondary text-sm"
            >
              {portalLoading ? 'Loading...' : 'Manage'}
            </button>
          )}
          <Link href="/subscription" className="btn-secondary text-sm">
            View Plans
          </Link>
        </div>
      </div>
      {isTrial && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            You're currently on a trial. <Link href="/subscription" className="font-semibold underline">Upgrade to a paid plan</Link> to continue receiving leads.
          </p>
        </div>
      )}
      {isPastDue && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            Your payment failed. Please <button onClick={handleManageSubscription} className="font-semibold underline">update your payment method</button> to continue service.
          </p>
        </div>
      )}
    </div>
  )
}

