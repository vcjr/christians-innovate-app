import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Get tomorrow's date in YYYY-MM-DD format (reminder sent day before)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Fetch all active meetings happening tomorrow
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('is_active', true)
      .gte('date', tomorrowStr)
      .lt('date', `${tomorrowStr}T23:59:59`)

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    if (!meetings || meetings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No meetings scheduled for tomorrow',
        sent: 0,
      })
    }

    let totalSent = 0
    let totalFailed = 0

    // For each meeting, send reminders
    for (const meeting of meetings) {
      // Get all registered attendees and users with meeting reminders enabled
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name')
        .eq('email_notifications_enabled', true)
        .eq('meeting_reminder_enabled', true)

      if (usersError || !users || users.length === 0) {
        console.log(`No users to notify for meeting ${meeting.id}`)
        continue
      }

      // Format meeting date and time
      const meetingDate = new Date(meeting.date)
      const formattedDate = meetingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const formattedTime = meetingDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })

      // Send emails using the meeting-reminder template
      const result = await sendBatchEmails({
        recipients: users.map((user) => ({
          email: user.email,
          userId: user.user_id,
          variables: {
            user: {
              name: user.full_name,
              email: user.email,
              id: user.user_id,
            },
            meeting: {
              title: meeting.title,
              description: meeting.description,
              date: formattedDate,
              time: formattedTime,
              zoom_link: meeting.zoom_link,
            },
          },
        })),
        templateKey: 'meeting-reminder',
        metadata: {
          type: 'meeting-reminder',
          meeting_id: meeting.id,
          meeting_date: meeting.date,
        },
      })

      totalSent += result.sent || 0
      totalFailed += result.failed || 0
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      meetings_processed: meetings.length,
    })
  } catch (error) {
    console.error('Meeting reminders error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
