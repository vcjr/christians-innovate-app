'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { unsubscribeExternalContact } from './actions'

interface ExternalUnsubscribeFormProps {
  email: string
  firstName: string | null
  currentlyUnsubscribed: boolean
}

export function ExternalUnsubscribeForm({
  email,
  firstName,
  currentlyUnsubscribed,
}: ExternalUnsubscribeFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(currentlyUnsubscribed)
  const [error, setError] = useState<string | null>(null)

  async function handleUnsubscribe() {
    setLoading(true)
    setError(null)

    const result = await unsubscribeExternalContact(email)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
          <p className="text-gray-600">
            <strong>{email}</strong> has been removed from our mailing list. You won&apos;t receive any more emails from us.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Changed your mind?{' '}
            <a href="/signup" className="text-blue-600 hover:underline">
              Join Christians Innovate
            </a>{' '}
            to manage your preferences.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unsubscribe{firstName ? `, ${firstName}` : ''}?
        </h1>
        <p className="text-gray-600 mb-2">
          You&apos;re about to unsubscribe <strong>{email}</strong> from Christians Innovate emails.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can always{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            create an account
          </a>{' '}
          to manage your preferences more granularly.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </p>
        )}

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Unsubscribing…' : 'Yes, unsubscribe me'}
        </button>
      </div>
    </div>
  )
}
