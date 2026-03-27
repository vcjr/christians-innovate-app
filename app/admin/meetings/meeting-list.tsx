'use client'

import { useState } from 'react'
import { toggleMeetingActive, deleteMeeting, duplicateMeeting } from './actions'
import { Calendar, Users, ExternalLink, Copy, Trash2, Power, Loader2, Edit } from 'lucide-react'
import { EditMeetingModal } from './edit-meeting-modal'
import { AttendeesModal } from './attendees-modal'

interface Meeting {
  id: string
  title: string
  description: string | null
  zoom_link: string
  meeting_date: string
  is_active: boolean
  created_at: string
  attendance_count?: number
  attendees?: { user_id: string; attended_at: string; user_profiles?: { full_name: string | null; email: string | null; avatar_url: string | null } }[]
}

interface MeetingListProps {
  meetings: Meeting[]
}

export function MeetingList({ meetings }: MeetingListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<string | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [viewingAttendees, setViewingAttendees] = useState<Meeting | null>(null)

  const handleToggleActive = async (meetingId: string, currentStatus: boolean) => {
    setLoadingId(meetingId)
    setActionType('toggle')
    await toggleMeetingActive(meetingId, currentStatus)
    setLoadingId(null)
    setActionType(null)
  }

  const handleDuplicate = async (meetingId: string) => {
    setLoadingId(meetingId)
    setActionType('duplicate')
    await duplicateMeeting(meetingId)
    setLoadingId(null)
    setActionType(null)
  }

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    setLoadingId(meetingId)
    setActionType('delete')
    await deleteMeeting(meetingId)
    setLoadingId(null)
    setActionType(null)
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings yet</h3>
        <p className="text-gray-600">Create your first meeting to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const meetingDate = new Date(meeting.meeting_date)
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const isPast = meetingDate < startOfToday
        const isLoading = loadingId === meeting.id

        return (
          <div
            key={meeting.id}
            className={`bg-white border rounded-lg p-6 shadow-sm ${meeting.is_active ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
              }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  {meeting.is_active && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                  {isPast && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Past
                    </span>
                  )}
                </div>
                {meeting.description && (
                  <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {meetingDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {meeting.attendance_count !== undefined && (
                    <button
                      onClick={() => setViewingAttendees(meeting)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      <span>{meeting.attendance_count} attendees</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={meeting.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Link
                </a>

                <button
                  onClick={() => setEditingMeeting(meeting)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleToggleActive(meeting.id, meeting.is_active)}
                  disabled={isLoading && actionType === 'toggle'}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${meeting.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  title={meeting.is_active ? 'Deactivate' : 'Activate'}
                >
                  {isLoading && actionType === 'toggle' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDuplicate(meeting.id)}
                  disabled={isLoading && actionType === 'duplicate'}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium disabled:opacity-50"
                  title="Duplicate"
                >
                  {isLoading && actionType === 'duplicate' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(meeting.id)}
                  disabled={isLoading && actionType === 'delete'}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                  title="Delete"
                >
                  {isLoading && actionType === 'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Created {new Date(meeting.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )
      })}

      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
        />
      )}

      {viewingAttendees && (
        <AttendeesModal
          meetingId={viewingAttendees.id}
          meetingTitle={viewingAttendees.title}
          attendees={viewingAttendees.attendees || []}
          onClose={() => setViewingAttendees(null)}
        />
      )}
    </div>
  )
}
