import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Inbox as InboxIcon } from 'lucide-react'
import { getInboxMessages, getSenderAddresses } from './actions'
import InboxClient from './inbox-client'

export default async function InboxPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    redirect('/dashboard')
  }

  const messagesResult = await getInboxMessages()
  const addressesResult = await getSenderAddresses()

  // Get user profile for personal email
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, email')
    .eq('user_id', user.id)
    .single()

  if (messagesResult.error || addressesResult.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
          Error loading data: {messagesResult.error || addressesResult.error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Email Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <InboxIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Inbox</h1>
        </div>
        <p className="text-gray-600">
          Receive and send emails using organizational addresses or custom email prefixes
        </p>
      </div>

      <InboxClient
        messages={messagesResult.messages || []}
        senderAddresses={addressesResult.addresses || []}
        userName={userProfile?.full_name || ''}
      />
    </div>
  )
}
