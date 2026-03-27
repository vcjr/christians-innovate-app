'use client'

import { useState } from 'react'
import { requestPasswordReset } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      await requestPasswordReset(formData)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/logo.png"
            alt="Christians Innovate"
            width={100}
            height={100}
            className="object-contain sm:w-[120px] sm:h-[120px]"
          />
        </div>

        <div className="bg-white border rounded-xl shadow-lg p-6 sm:p-8">
          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-3">Check your inbox</h1>
              <p className="text-gray-600 text-sm mb-6">
                If an account exists for that email address, you'll receive a password reset link shortly. Check your spam folder if you don't see it.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">
                  Forgot your password?
                </h1>
                <p className="text-gray-600 text-sm text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
