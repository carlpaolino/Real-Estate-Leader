import { useState, useEffect } from 'react'
import { useSupabase } from '../_app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function ResetPassword({ session }: { session: any }) {
  const supabase = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [isResetSent, setIsResetSent] = useState(false)

  useEffect(() => {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      // User clicked the reset link, redirect to update password page
      router.push(`/auth/update-password?access_token=${accessToken}`)
    }
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setMessage('Password reset email sent! Check your inbox for instructions.')
      setMessageType('success')
      setIsResetSent(true)
    } catch (error: any) {
      setMessage(error.message || 'Error sending password reset email. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password - Leader</title>
        <meta name="description" content="Reset your Leader account password" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <h1 className="text-4xl font-bold text-primary-600">Leader</h1>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>

          <div className="card p-8">
            {!isResetSent ? (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* Messages */}
                {message && (
                  <div
                    className={`mb-4 p-4 rounded-md ${
                      messageType === 'success'
                        ? 'bg-success-50 text-success-800 border border-success-200'
                        : 'bg-danger-50 text-danger-800 border border-danger-200'
                    }`}
                  >
                    <p className="text-sm">{message}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field mt-1"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                  <svg
                    className="h-6 w-6 text-success-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
                <p className="mt-2 text-sm text-gray-600">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setIsResetSent(false)
                      setEmail('')
                      setMessage('')
                    }}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Send another email
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/auth/login"
                className="w-full flex justify-center btn-secondary"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

