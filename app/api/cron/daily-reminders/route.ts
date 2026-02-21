import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret to ensure only Vercel Cron can trigger this
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Fetch all plan days assigned for today
    const { data: todaysDays, error: daysError } = await supabase
      .from('plan_days')
      .select(
        `
        id,
        day_number,
        scripture_reference,
        content_markdown,
        plan_id,
        reading_plans!inner (
          id,
          title,
          description
        )
      `
      )
      .eq('date_assigned', today)

    if (daysError) {
      console.error('Error fetching today\'s days:', daysError)
      return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 })
    }

    if (!todaysDays || todaysDays.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reading days scheduled for today',
        sent: 0,
      })
    }

    let totalSent = 0
    let totalFailed = 0

    // For each day, send reminders to subscribed users
    for (const day of todaysDays) {
      // Get all users subscribed to this plan with email enabled
      const { data: subscribers, error: subsError } = await supabase
        .from('plan_subscriptions')
        .select(
          `
          user_id,
          user_profiles!inner (
            email,
            full_name,
            email_notifications_enabled,
            daily_reminder_enabled
          )
        `
        )
        .eq('plan_id', day.plan_id)
        .eq('user_profiles.email_notifications_enabled', true)
        .eq('user_profiles.daily_reminder_enabled', true)

      if (subsError || !subscribers || subscribers.length === 0) {
        console.log(`No subscribers for plan ${day.plan_id}`)
        continue
      }

      // Build the reading day URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const dayLink = `${siteUrl}/dashboard/day/${day.id}`

      // Send emails using the daily-reminder template
      const result = await sendBatchEmails({
        recipients: subscribers.map((sub) => ({
          email: sub.user_profiles.email,
          userId: sub.user_id,
          variables: {
            user: {
              name: sub.user_profiles.full_name,
              email: sub.user_profiles.email,
              id: sub.user_id,
            },
            day: {
              number: day.day_number,
              scripture: day.scripture_reference,
              title: day.reading_plans.title,
              link: dayLink,
            },
          },
        })),
        templateKey: 'daily-reminder',
        metadata: {
          type: 'daily-reminder',
          day_id: day.id,
          plan_id: day.plan_id,
          date: today,
        },
      })

      totalSent += result.sent || 0
      totalFailed += result.failed || 0
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      days_processed: todaysDays.length,
    })
  } catch (error) {
    console.error('Daily reminders error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
