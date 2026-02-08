import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateMeetingForm } from './create-meeting-form'
import { MeetingList } from './meeting-list'
import { Calendar } from 'lucide-react'

export default async function MeetingsPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return redirect('/dashboard')
  }

  // Fetch all meetings
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: false })

  // Fetch attendance with user profiles for all meetings
  const { data: attendanceData } = await supabase
    .from('meeting_attendance')
    .select(`
      meeting_id,
      user_id,
      attended_at
    `)

  // Fetch user profiles separately
  const userIds = [...new Set(attendanceData?.map(a => a.user_id) || [])]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email, avatar_url')
    .in('user_id', userIds)

  // Create a map of user profiles
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

  // Combine the data
  const meetingsWithCounts = meetings?.map(meeting => {
    const attendees = attendanceData
      ?.filter(a => a.meeting_id === meeting.id)
      .map(attendance => ({
        user_id: attendance.user_id,
        attended_at: attendance.attended_at,
        user_profiles: profileMap.get(attendance.user_id) || null
      })) || []

    return {
      ...meeting,
      attendance_count: attendees.length,
      attendees
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Meetings Management</h1>
          </div>
          <p className="text-gray-600">
            Create and manage meeting announcements. Active meetings will appear in the announcement bar.
          </p>
        </div>

        {/* Create Meeting Form */}
        <CreateMeetingForm />

        {/* Meetings List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Meetings</h2>
          <MeetingList meetings={meetingsWithCounts} />
        </div>
      </div>
    </div>
  )
}
