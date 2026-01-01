import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabase } from '../_app'
import { ensureUserProfile } from '@/lib/auth'
import Head from 'next/head'

/**
 * Handles OAuth and magic link callbacks from Supabase
 */
export default function AuthCallback() {
  const supabase = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=auth_failed')
          return
        }

        if (data.session?.user) {
          // Ensure user profile exists
          await ensureUserProfile(
            supabase,
            data.session.user.id,
            data.session.user.email || ''
          )

          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error handling auth callback:', error)
        router.push('/auth/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  return (
    <>
      <Head>
        <title>Authenticating... - Leader</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    </>
  )
}

