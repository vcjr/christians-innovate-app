'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'
import { approveJoinRequest, rejectJoinRequest } from '@/app/accountability/actions'

export interface JoinRequest {
  id: string
  requester_id: string
  created_at: string
  message: string | null
  requester: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface PendingJoinRequestsProps {
  requests: JoinRequest[]
  groupName: string
}

export function PendingJoinRequests({ requests: initialRequests, groupName }: PendingJoinRequestsProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = async (requestId: string, name: string) => {
    setLoadingId(requestId)
    const result = await approveJoinRequest(requestId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setRequests(prev => prev.filter(r => r.id !== requestId))
      showToast(`${name} has been added to ${groupName}!`, 'success')
      router.refresh()
    }
    setLoadingId(null)
  }

  const handleReject = async (requestId: string) => {
    setLoadingId(requestId)
    const result = await rejectJoinRequest(requestId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      setRequests(prev => prev.filter(r => r.id !== requestId))
      showToast('Request declined', 'success')
    }
    setLoadingId(null)
  }

  if (requests.length === 0) return null

  return (
    <>
      <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-600" />
          Join Requests
          <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{requests.length}</span>
        </h3>
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {req.requester.avatar_url ? (
                  <img src={req.requester.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(req.requester.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{req.requester.full_name || 'Unknown'}</p>
                  {req.message && <p className="text-xs text-gray-500 truncate">{req.message}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(req.id, req.requester.full_name || 'This person')}
                  disabled={loadingId === req.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={loadingId === req.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
    </>
  )
}
