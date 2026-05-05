'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Clock, X, Loader2 } from 'lucide-react'
import { requestToJoinGroup, cancelJoinRequest } from '@/app/accountability/actions'

interface JoinRequestButtonProps {
  groupId: string
  existingRequest: { id: string; status: string } | null
}

export function JoinRequestButton({ groupId, existingRequest }: JoinRequestButtonProps) {
  const router = useRouter()
  const [request, setRequest] = useState(existingRequest)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRequest(existingRequest)
  }, [existingRequest])

  const handleRequest = async () => {
    setIsLoading(true)
    setError(null)
    const result = await requestToJoinGroup(groupId)
    if (result.error) {
      setError(result.error)
    } else {
      setRequest({ id: result.requestId!, status: 'pending' })
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleCancel = async () => {
    if (!request) return
    setIsLoading(true)
    const result = await cancelJoinRequest(request.id)
    if (result.error) {
      setError(result.error)
    } else {
      setRequest(null)
      router.refresh()
    }
    setIsLoading(false)
  }

  if (request?.status === 'pending') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium">
            <Clock className="h-4 w-4" />
            Requested
          </span>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            title="Cancel request"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  if (request?.status === 'rejected') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleRequest}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Request Again
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRequest}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Request to Join
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
