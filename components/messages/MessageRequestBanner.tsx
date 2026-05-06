'use client'

import { useState } from 'react'
import { Clock, UserCheck } from 'lucide-react'
import { acceptMessageRequest, declineMessageRequest } from '@/app/messages/actions'

interface MessageRequestBannerProps {
  conversationId: string
  isRequester: boolean
  otherUserName: string
}

export function MessageRequestBanner({
  conversationId,
  isRequester,
  otherUserName,
}: MessageRequestBannerProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleAccept() {
    setIsLoading(true)
    await acceptMessageRequest(conversationId)
    // revalidatePath in the action will cause a refresh; no need to setIsLoading(false)
  }

  async function handleDecline() {
    setIsLoading(true)
    await declineMessageRequest(conversationId)
    // action redirects to /messages on success
  }

  if (isRequester) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-blue-50 p-4">
          <Clock className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Request sent to {otherUserName}</p>
          <p className="mt-1 text-sm text-gray-500">
            You&apos;ll be notified when they accept. You can message once they do.
          </p>
        </div>
        <button
          onClick={handleDecline}
          disabled={isLoading}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition"
        >
          {isLoading ? 'Cancelling…' : 'Cancel request'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-green-50 p-4">
        <UserCheck className="h-8 w-8 text-green-500" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{otherUserName} wants to connect</p>
        <p className="mt-1 text-sm text-gray-500">
          Accept their request to start exchanging messages.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
        >
          {isLoading ? 'Accepting…' : 'Accept'}
        </button>
        <button
          onClick={handleDecline}
          disabled={isLoading}
          className="px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
        >
          {isLoading ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </div>
  )
}
