import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function SubscriptionSuccess() {
  const router = useRouter()
  const { session_id } = router.query
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait a moment for Stripe webhook to process
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Head>
        <title>Subscription Successful - Leader</title>
        <meta name="description" content="Your subscription is now active" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h1>
              <p className="text-gray-600">Setting up your subscription</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Subscription Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Your subscription is now active. You can start using all the features of your plan.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard" className="btn-primary w-full block">
                  Go to Dashboard
                </Link>
                <Link href="/subscription" className="btn-secondary w-full block">
                  View Subscription Details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

