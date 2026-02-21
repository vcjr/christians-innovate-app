'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { unsubscribeFromEmails } from './actions'

interface UnsubscribeFormProps {
  userId: string
  email: string
  currentlyUnsubscribed: boolean
  userName: string | null
}

export function UnsubscribeForm({
  userId,
  email,
  currentlyUnsubscribed,
  userName,
}: UnsubscribeFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(currentlyUnsubscribed)
  const [error, setError] = useState<string | null>(null)

  async function handleUnsubscribe() {
    setLoading(true)
    setError(null)

    const result = await unsubscribeFromEmails(userId)

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
        <div className="max-w-md w-full bg-white rounded-lg border border-green-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Successfully Unsubscribed
          </h1>
          <p className="text-gray-600 mb-6">
            You have been unsubscribed from all email notifications from Christians
            Innovate. You won't receive any more emails from us.
          </p>
          <div className="space-y-3">
            <a
              href="/settings"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Update Email Preferences
            </a>
            <a
              href="/dashboard"
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unsubscribe from Emails
          </h1>
          {userName && (
            <p className="text-gray-600 mb-2">Hello, {userName}!</p>
          )}
          <p className="text-gray-600">
            We're sorry to see you go. Unsubscribing will stop all emails from
            Christians Innovate, including:
          </p>
        </div>

        <ul className="space-y-2 mb-6 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <span>Daily Bible reading reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <span>Meeting reminders and announcements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <span>Weekly community digests</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <span>Important community updates</span>
          </li>
        </ul>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You can re-enable email notifications at any
            time from your account settings.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Unsubscribing...
              </>
            ) : (
              'Unsubscribe from All Emails'
            )}
          </button>

          <a
            href="/settings"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-center"
          >
            Manage Email Preferences Instead
          </a>
        </div>
      </div>
    </div>
  )
}
