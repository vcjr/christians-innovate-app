import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { sendBatchEmails, sendEmail } from '@/utils/email/sender'
import { composeEmail } from '@/utils/email/compose'
import { interpolateTemplate } from '@/utils/email/templates'
import { generateExternalUnsubscribeUrl } from '@/utils/email/tokens'
import type { EmailBlock } from '@/utils/email/blocks'

// NOTE: intentionally NOT 'edge' runtime — composeEmail uses Buffer for the
// BLOCKS_META comment which requires Node.js runtime.
export const dynamic = 'force-dynamic'

// Meeting reminder blocks for external contacts: same content as stored template
// but with an appended "Join Christians Innovate" CTA — shown only to non-members.
const externalMeetingBlocks: EmailBlock[] = [
  { type: 'badge', text: 'Meeting Reminder', color: 'green' },
  {
    type: 'hero',
    heading: '📅 Meeting Tomorrow',
    body: 'Hi <strong>{{user.name}}</strong>, this is a friendly reminder about tomorrow\'s Christians Innovate community meeting.',
  },
  {
    type: 'detail-card',
    rows: [
      { emoji: '📋', label: 'Meeting', value: '{{meeting.title}}' },
      { emoji: '📅', label: 'When', value: '{{meeting.date}} at {{meeting.time}}' },
      { emoji: '💬', label: 'About', value: '{{meeting.description}}' },
    ],
  },
  { type: 'primary-cta', label: 'Join Zoom Meeting →', url: '{{meeting.zoom_link}}' },
  { type: 'divider' },
  {
    type: 'hero',
    heading: 'Join the Full Experience',
    body: 'Connect deeper with the Christians Innovate community. Access the member directory, reading plans, prayer requests, and more.',
  },
  { type: 'primary-cta', label: 'Join Christians Innovate →', url: '{{signup_url}}' },
]

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

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

    // Fetch external contacts once — same list for all meetings
    const { data: externalContacts, error: externalError } = await supabase
      .from('external_contacts')
      .select('id, email, first_name, last_name')
      .eq('is_unsubscribed', false)

    if (externalError) {
      console.error('Error fetching external contacts:', externalError)
      // Continue — still send to app members
    }

    let totalSent = 0
    let totalFailed = 0
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.christiansinnovate.com'

    for (const meeting of meetings) {
      // ── Format meeting date and time ───────────────────────────────────────
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

      // ── App members: use stored DB template ────────────────────────────────
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name')
        .eq('email_notifications_enabled', true)
        .eq('meeting_reminder_enabled', true)

      if (!usersError && users && users.length > 0) {
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
              site_url: siteUrl,
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
      } else if (usersError) {
        console.log(`No app users to notify for meeting ${meeting.id}`)
      }

      // ── External contacts: dynamically composed with join CTA ──────────────
      if (externalContacts && externalContacts.length > 0) {
        // Compose full HTML once with placeholder variables (interpolated per-recipient)
        const baseHtml = composeEmail(externalMeetingBlocks, {
          preheaderText: `📅 Meeting Reminder: ${meeting.title} — Tomorrow`,
        })
        const subject = `📅 Reminder: ${meeting.title} is tomorrow`

        for (const contact of externalContacts) {
          try {
            const displayName =
              [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
              contact.email

            const html = interpolateTemplate(baseHtml, {
              user: { name: displayName, email: contact.email },
              meeting: {
                title: meeting.title,
                description: meeting.description,
                date: formattedDate,
                time: formattedTime,
                zoom_link: meeting.zoom_link,
              },
              site_url: siteUrl,
              signup_url: `${siteUrl}/signup`,
              unsubscribe_link: generateExternalUnsubscribeUrl(contact.email),
            })

            const result = await sendEmail({
              to: contact.email,
              subject,
              html,
              templateKey: 'meeting-reminder',
              metadata: {
                type: 'meeting-reminder-external',
                meeting_id: meeting.id,
                contact_id: contact.id,
              },
            })

            if (result.success) totalSent++
            else totalFailed++
          } catch (err) {
            console.error(`Failed to send to external contact ${contact.email}:`, err)
            totalFailed++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      meetings_processed: meetings.length,
      external_contacts_notified: externalContacts?.length ?? 0,
    })
  } catch (error) {
    console.error('Meeting reminders error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
