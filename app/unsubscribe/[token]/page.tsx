import { createClient } from '@/utils/supabase/server'
import { verifyUnsubscribeToken } from '@/utils/email/tokens'
import { UnsubscribeForm } from './unsubscribe-form'

interface UnsubscribePageProps {
  params: Promise<{ token: string }>
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const { token } = await params

  // Verify the token
  const payload = verifyUnsubscribeToken(token)

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This unsubscribe link is invalid or has expired. Please use the most recent unsubscribe link from an email or update your preferences in your account settings.
          </p>
          <a
            href="/settings"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Check if user exists and get current settings
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email_notifications_enabled, full_name')
    .eq('user_id', payload.userId)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600">
            We couldn&apos;t find a user account associated with this link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <UnsubscribeForm
      userId={payload.userId}
      email={payload.email}
      currentlyUnsubscribed={!profile.email_notifications_enabled}
      userName={profile.full_name}
    />
  )
}
