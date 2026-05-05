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

    // Get date range for the past week
    const today = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(today.getDate() - 7)

    // Count launch & prayer posts from the past week
    const { data: posts, error: postsError } = await supabase
      .from('launch_prayer_posts')
      .select('type')
      .gte('created_at', oneWeekAgo.toISOString())
      .eq('is_active', true)
      .eq('is_hidden', false)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    const launches = posts?.filter((p) => p.type === 'launch').length || 0
    const prayers = posts?.filter((p) => p.type === 'prayer').length || 0
    const wins = posts?.filter((p) => p.type === 'win').length || 0

    // Get upcoming meetings (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    const { data: upcomingMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('title, date')
      .eq('is_active', true)
      .gte('date', today.toISOString())
      .lte('date', nextWeek.toISOString())
      .order('date', { ascending: true })

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
    }

    // Format upcoming meetings
    const formattedMeetings =
      upcomingMeetings?.map((meeting) => ({
        title: meeting.title,
        date: new Date(meeting.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      })) || []

    // Get all users with weekly digest enabled
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .eq('email_notifications_enabled', true)
      .eq('weekly_digest_enabled', true)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users subscribed to weekly digest',
        sent: 0,
      })
    }

    // Send digest emails
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
          digest: {
            launches,
            prayers,
            wins,
            upcoming_meetings: formattedMeetings,
          },
        },
      })),
      templateKey: 'weekly-digest',
      metadata: {
        type: 'weekly-digest',
        week_start: oneWeekAgo.toISOString().split('T')[0],
        week_end: today.toISOString().split('T')[0],
      },
    })

    return NextResponse.json({
      success: true,
      sent: result.sent || 0,
      failed: result.failed || 0,
      stats: {
        launches,
        prayers,
        wins,
        upcoming_meetings: formattedMeetings.length,
      },
    })
  } catch (error) {
    console.error('Weekly digest error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
