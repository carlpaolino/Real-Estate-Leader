import { useState, useEffect } from 'react'
import { useSupabase } from '../_app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ensureUserProfile } from '@/lib/auth'

export default function Login({ session }: { session: any }) {
  const supabase = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password')

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Ensure user profile exists
      if (data.user) {
        await ensureUserProfile(supabase, data.user.id, data.user.email || '')
      }

      router.push('/dashboard')
    } catch (error: any) {
      setMessage(error.message || 'Error signing in. Please check your credentials.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
      setMessage('Check your email for the magic link!')
      setMessageType('success')
    } catch (error: any) {
      setMessage(error.message || 'Error sending magic link. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }


  if (session) {
    return null
  }

  return (
    <>
      <Head>
        <title>Login - Leader</title>
        <meta name="description" content="Login to your Leader account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <h1 className="text-4xl font-bold text-primary-600">Leader</h1>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
                create a new account
              </Link>
            </p>
          </div>

          <div className="card p-8">
            {/* Auth Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password')
                  setMessage('')
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  authMode === 'password'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('magic-link')
                  setMessage('')
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  authMode === 'magic-link'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Magic Link
              </button>
            </div>

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

            {/* Password Login Form */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
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
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link
                      href="/auth/reset-password"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field mt-1"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            )}

            {/* Magic Link Form */}
            {authMode === 'magic-link' && (
              <form onSubmit={handleMagicLink} className="space-y-6">
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="magic-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field mt-1"
                    placeholder="Enter your email"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    We'll send you a magic link to sign in without a password.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to Leader?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/auth/signup"
                  className="w-full flex justify-center btn-secondary"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

