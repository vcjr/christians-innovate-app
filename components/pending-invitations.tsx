'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Check, X, Loader2, Users } from 'lucide-react'
import { acceptInvitation, declineInvitation } from '@/app/accountability/actions'

interface PendingInvitation {
  id: string
  group_id: string
  invited_by: string
  status: string
  created_at: string
  group: {
    name: string
    target_objective: string
  }
  inviter: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface PendingInvitationsProps {
  invitations: PendingInvitation[]
}

export function PendingInvitations({ invitations: initialInvitations }: PendingInvitationsProps) {
  const router = useRouter()
  const [invitations, setInvitations] = useState(initialInvitations)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAccept = async (invitationId: string, groupName: string) => {
    setLoadingId(invitationId)
    try {
      const result = await acceptInvitation(invitationId)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast(`You joined "${groupName}"!`, 'success')
        router.refresh()
      }
    } catch {
      showToast('Failed to accept invitation', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    setLoadingId(invitationId)
    try {
      const result = await declineInvitation(invitationId)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        setInvitations(prev => prev.filter(i => i.id !== invitationId))
        showToast('Invitation declined', 'success')
      }
    } catch {
      showToast('Failed to decline invitation', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  if (invitations.length === 0) return null

  return (
    <>
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Pending Invitations
        </h3>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{invitation.group.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Invited by <span className="font-medium text-gray-700">{invitation.inviter.full_name || 'Unknown'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Objective:</span> {invitation.group.target_objective}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(invitation.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAccept(invitation.id, invitation.group.name)}
                    disabled={loadingId === invitation.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loadingId === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={loadingId === invitation.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toastMessage.text}
        </div>
      )}
    </>
  )
}
