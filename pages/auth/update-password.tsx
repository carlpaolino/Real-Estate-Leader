import { useState, useEffect } from 'react'
import { useSupabase } from '../_app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function UpdatePassword({ session }: { session: any }) {
  const supabase = useSupabase()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [isUpdated, setIsUpdated] = useState(false)

  useEffect(() => {
    // Check if user has a valid session (from password reset link)
    const checkSession = async () => {
      if (!session) {
        // Try to get session from URL hash if present (Supabase uses hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        if (accessToken && type === 'recovery') {
          // Exchange the token for a session
          try {
            const { error: exchangeError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            })
            
            if (exchangeError) {
              setMessage('Invalid or expired reset link. Please request a new password reset.')
              setMessageType('error')
            }
          } catch (error) {
            setMessage('Invalid or expired reset link. Please request a new password reset.')
            setMessageType('error')
          }
        } else if (!accessToken) {
          // Check query params as fallback
          const queryToken = router.query.access_token as string
          if (!queryToken) {
            setMessage('Invalid or expired reset link. Please request a new password reset.')
            setMessageType('error')
          }
        }
      }
    }
    
    checkSession()
  }, [session, supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage('Password updated successfully! Redirecting to dashboard...')
      setMessageType('success')
      setIsUpdated(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setMessage(error.message || 'Error updating password. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Update Password - Leader</title>
        <meta name="description" content="Update your Leader account password" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <h1 className="text-4xl font-bold text-primary-600">Leader</h1>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Update your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

          <div className="card p-8">
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

            {!isUpdated ? (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field mt-1"
                    placeholder="Enter your new password"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field mt-1"
                    placeholder="Confirm your new password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-danger-600">Passwords do not match</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
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
                <h3 className="mt-4 text-lg font-medium text-gray-900">Password Updated!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been successfully updated. Redirecting to dashboard...
                </p>
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

