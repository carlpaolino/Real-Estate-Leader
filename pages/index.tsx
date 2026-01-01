import Head from 'next/head'
import Link from 'next/link'

export default function Home({ session }: { session: any }) {

  return (
    <>
      <Head>
        <title>Leader - Real Estate Lead Platform</title>
        <meta name="description" content="Transform your real estate business with curated pre-foreclosure leads" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Leader</h1>
              </div>
              <div className="flex items-center space-x-4">
                {session ? (
                  <Link href="/dashboard" className="btn-primary">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn-secondary">
                      Sign In
                    </Link>
                    <Link href="/auth/signup" className="btn-primary">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Transform Your</span>{' '}
                    <span className="block text-primary-600 xl:inline">Real Estate Business</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Get access to curated, high-quality pre-foreclosure leads delivered weekly. 
                    Connect with motivated sellers before your competition.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      {session ? (
                        <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                          Go to Dashboard
                        </Link>
                      ) : (
                        <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                          Get Started
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to succeed
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our platform provides everything you need to identify and connect with motivated sellers.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Curated Leads</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Get 5 high-quality pre-foreclosure leads delivered to your inbox every week.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Smart Scoring</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Our AI-powered scoring system identifies the most motivated sellers.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Automated Outreach</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Automatically reach out to homeowners with personalized messages.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Dashboard Analytics</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Track your leads, responses, and conversions in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign In Section */}
        {!session && (
          <div className="py-12 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Get Started?</h2>
                <p className="text-lg text-gray-600">
                  Join Leader today and start receiving curated pre-foreclosure leads
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">New User?</h3>
                  <p className="text-gray-600 mb-6">
                    Create an account to start receiving weekly leads delivered to your inbox.
                  </p>
                  <Link href="/auth/signup" className="btn-primary w-full">
                    Create Account
                  </Link>
                </div>
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Already Have an Account?</h3>
                  <p className="text-gray-600 mb-6">
                    Sign in to access your dashboard and manage your leads.
                  </p>
                  <Link href="/auth/login" className="btn-secondary w-full">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">Leader</h3>
              <p className="mt-2 text-gray-400">
                Transforming real estate lead generation through data-driven insights.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
} 