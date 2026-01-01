import { useEffect, useState } from 'react'
import { useSupabase } from './_app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { PLANS, PlanId } from '@/lib/stripe'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Subscription({ session }: { session: any }) {
  const supabase = useSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchSubscriptionStatus()
  }, [session, router])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/stripe/subscription-status?userId=${session.user.id}`)
      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    }
  }

  const handleCheckout = async (planId: PlanId) => {
    if (!session?.user?.id) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    setSelectedPlan(planId)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session.user.id,
        }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else if (sessionId) {
        // Use Stripe.js to redirect
        const stripe = await stripePromise
        if (stripe) {
          const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId,
          })
          if (stripeError) {
            throw stripeError
          }
        }
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      alert(error.message || 'Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!session?.user?.id) return

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
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
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  const isActive = subscriptionStatus?.status === 'active' || subscriptionStatus?.status === 'trialing'

  return (
    <>
      <Head>
        <title>Subscription Plans - Leader</title>
        <meta name="description" content="Choose your subscription plan" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/dashboard" className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Leader</h1>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <span className="text-sm text-gray-600">
                  {session.user?.email}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your real estate investment needs
            </p>
            {isActive && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {subscriptionStatus?.status === 'trialing' ? 'Trial Active' : 'Subscription Active'}
                  {subscriptionStatus?.plan && ` - ${subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} Plan`}
                </span>
              </div>
            )}
          </div>

          {/* Subscription Status Card */}
          {isActive && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Subscription</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscriptionStatus?.plan && (
                        <span className="capitalize">{subscriptionStatus.plan} Plan</span>
                      )}
                      {subscriptionStatus?.endDate && (
                        <span className="ml-2">
                          • Renews {new Date(subscriptionStatus.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    {loading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {Object.entries(PLANS).map(([planId, plan]) => {
              const isCurrentPlan = subscriptionStatus?.plan === planId && isActive
              const isPopular = planId === 'pro'

              return (
                <div
                  key={planId}
                  className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                    isPopular ? 'ring-2 ring-primary-500 transform scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                      Current Plan
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <button
                        onClick={handleManageSubscription}
                        disabled={loading}
                        className="w-full btn-secondary"
                      >
                        Manage Subscription
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckout(planId as PlanId)}
                        disabled={loading || selectedPlan === planId}
                        className={`w-full ${
                          isPopular ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        {loading && selectedPlan === planId
                          ? 'Processing...'
                          : isActive
                          ? 'Switch Plan'
                          : 'Get Started'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated
                  and reflected in your next billing cycle.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards through our secure Stripe payment processor.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access
                  until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

