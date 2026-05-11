import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  hasActiveStripeSubscription,
  getSubscribedPlanId,
  getEffectivePlanLimits,
} from '@/lib/subscription'
import { PLANS } from '@/lib/stripe'

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

  const hasPaid = hasActiveStripeSubscription(subscriptionStatus)
  const subscribedPlanId = getSubscribedPlanId(subscriptionStatus)
  const subscribedPlanName =
    subscribedPlanId != null ? PLANS[subscribedPlanId].name : null
  const planLimits = getEffectivePlanLimits(subscriptionStatus)

  const isAppTrialOnly =
    subscriptionStatus?.status === 'trial' && !subscriptionStatus?.hasSubscription

  const isCanceled =
    subscriptionStatus?.status === 'canceled' &&
    !hasPaid

  const isPastDue = subscriptionStatus?.status === 'past_due' && hasPaid

  const statusLabel = (() => {
    if (!subscriptionStatus) return 'Inactive'
    const st = subscriptionStatus.status
    if (hasPaid && st === 'active') return 'Active'
    if (hasPaid && st === 'trialing') return 'Trialing'
    if (hasPaid && st === 'past_due') return 'Past due'
    if (isAppTrialOnly) return 'Trial'
    if (st === 'canceled') return 'Canceled'
    if (st === 'inactive') return 'Inactive'
    return 'Inactive'
  })()

  const badgeClass = (() => {
    if (hasPaid && subscriptionStatus?.status === 'active') return 'bg-green-100 text-green-800'
    if (hasPaid && subscriptionStatus?.status === 'trialing') return 'bg-blue-100 text-blue-800'
    if (isPastDue) return 'bg-yellow-100 text-yellow-800'
    if (isAppTrialOnly) return 'bg-blue-100 text-blue-800'
    if (isCanceled || subscriptionStatus?.status === 'canceled') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  })()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Status</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}
            >
              {statusLabel}
            </span>
            {subscribedPlanName && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-800">
                {subscribedPlanName} plan
              </span>
            )}
            {hasPaid && (
              <span className="text-sm text-gray-600">
                {planLimits.weeklyLeads} leads/week
              </span>
            )}
            {subscriptionStatus?.endDate && hasPaid && subscriptionStatus?.status !== 'canceled' && (
              <span className="text-sm text-gray-500">
                Renews {new Date(subscriptionStatus.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          {!hasPaid && (
            <Link href="/subscription" className="btn-primary text-sm">
              Subscribe
            </Link>
          )}
          {hasPaid && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="btn-secondary text-sm"
            >
              {portalLoading ? 'Loading...' : 'Manage'}
            </button>
          )}
          <Link href="/subscription" className="btn-secondary text-sm">
            {hasPaid ? 'Plans' : 'View Plans'}
          </Link>
        </div>
      </div>
      {isAppTrialOnly && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            You&apos;re on a trial account.{' '}
            <Link href="/subscription" className="font-semibold underline">
              Choose a paid plan
            </Link>{' '}
            to continue receiving leads.
          </p>
        </div>
      )}
      {isPastDue && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            Your payment failed. Please{' '}
            <button type="button" onClick={handleManageSubscription} className="font-semibold underline">
              update your payment method
            </button>{' '}
            to continue service.
          </p>
        </div>
      )}
    </div>
  )
}
