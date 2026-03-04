import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'
import { fetchVerseSnippetsForEmail } from '@/utils/bible-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret to ensure only Vercel Cron can trigger this
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Fetch all plan days assigned for today
    const { data: todaysDays, error: daysError } = await supabase
      .from('plan_days')
      .select('id, day_number, scripture_reference, plan_id')
      .eq('date_assigned', today)

    if (daysError) {
      console.error('Error fetching today\'s days:', daysError)
      return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 })
    }

    let totalSent = 0
    let totalFailed = 0

    if (!todaysDays || todaysDays.length === 0) {
      // Fallback: use the default plan with sequential day-number calculation
      const { data: defaultPlan } = await supabase
        .from('reading_plans')
        .select('id, title, description')
        .eq('is_default', true)
        .single()

      if (!defaultPlan) {
        return NextResponse.json({
          success: true,
          message: 'No reading days scheduled for today and no default plan set',
          sent: 0,
        })
      }

      // Get all subscribers including subscribed_at for day-number math
      const { data: allSubscribers } = await supabase
        .from('plan_subscriptions')
        .select(
          `
          user_id,
          subscribed_at,
          user_profiles!inner (
            email,
            full_name,
            email_notifications_enabled,
            daily_reminder_enabled
          )
        `
        )
        .eq('plan_id', defaultPlan.id)

      if (!allSubscribers || allSubscribers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No subscribers for default plan',
          sent: 0,
        })
      }

      const todayMs = new Date(today).getTime()
      const msPerDay = 86_400_000

      type ProfileShape = {
        email: string
        full_name: string
        email_notifications_enabled: boolean
        daily_reminder_enabled: boolean
      }

      // Map each subscriber to their current day number
      const subscriberDays = allSubscribers
        .map((sub) => {
          const profile = (Array.isArray(sub.user_profiles) ? sub.user_profiles[0] : sub.user_profiles) as ProfileShape
          if (!profile?.email_notifications_enabled || !profile?.daily_reminder_enabled) return null
          const subscribedAtMs = new Date(sub.subscribed_at as string).getTime()
          const dayNumber = Math.max(1, Math.floor((todayMs - subscribedAtMs) / msPerDay) + 1)
          return { sub, profile, dayNumber }
        })
        .filter(Boolean) as { sub: typeof allSubscribers[0]; profile: ProfileShape; dayNumber: number }[]

      const uniqueDayNumbers = [...new Set(subscriberDays.map((s) => s.dayNumber))]

      const { data: planDays } = await supabase
        .from('plan_days')
        .select('id, day_number, scripture_reference')
        .eq('plan_id', defaultPlan.id)
        .in('day_number', uniqueDayNumbers)

      if (!planDays || planDays.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Subscribers have advanced past the end of the default plan',
          sent: 0,
        })
      }

      const dayMap = Object.fromEntries(planDays.map((d) => [d.day_number, d]))
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      // Fetch real verse text for all unique references in one batch
      const verseSnippets = await fetchVerseSnippetsForEmail(
        planDays.map((d) => d.scripture_reference)
      )

      const recipients = subscriberDays
        .filter((s) => dayMap[s.dayNumber])
        .map((s) => {
          const pd = dayMap[s.dayNumber]
          // day.title = scripture reference (e.g. "Genesis 1:1-31") — used in subject + body heading
          // day.scripture = first ~3 verses of real Bible text from the database
          const scriptureSnippet = verseSnippets.get(pd.scripture_reference) || pd.scripture_reference
          return {
            email: s.profile.email,
            userId: s.sub.user_id,
            variables: {
              user: { name: s.profile.full_name, email: s.profile.email, id: s.sub.user_id },
              day: {
                number: pd.day_number,
                title: pd.scripture_reference,
                scripture: scriptureSnippet,
                link: `${siteUrl}/dashboard/day/${pd.id}`,
              },
              site_url: siteUrl,
            },
          }
        })

      if (recipients.length > 0) {
        const result = await sendBatchEmails({
          recipients,
          templateKey: 'daily-reminder',
          metadata: { type: 'daily-reminder', plan_id: defaultPlan.id, date: today },
        })
        totalSent += result.sent || 0
        totalFailed += result.failed || 0
      }

      return NextResponse.json({
        success: true,
        sent: totalSent,
        failed: totalFailed,
        strategy: 'sequential-default-plan',
      })
    }

    // Strategy 1: date_assigned rows found — send per-day emails
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

      // Fetch real verse text for the scripture reference
      const verseSnippets = await fetchVerseSnippetsForEmail([day.scripture_reference])
      const scriptureSnippet = verseSnippets.get(day.scripture_reference) || day.scripture_reference

      // Send emails using the daily-reminder template
      const result = await sendBatchEmails({
        recipients: subscribers.map((sub) => {
          const profile = (Array.isArray(sub.user_profiles) ? sub.user_profiles[0] : sub.user_profiles) as {
            email: string
            full_name: string
            email_notifications_enabled: boolean
            daily_reminder_enabled: boolean
          }
          return {
            email: profile.email,
            userId: sub.user_id,
            variables: {
              user: {
                name: profile.full_name,
                email: profile.email,
                id: sub.user_id,
              },
              day: {
                number: day.day_number,
                title: day.scripture_reference,
                scripture: scriptureSnippet,
                link: dayLink,
              },
              site_url: siteUrl,
            },
          }
        }),
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
