'use server'

import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'
import { renderEmailTemplate, extractTemplateVariables } from '@/utils/email/templates'
import { generateUnsubscribeUrl } from '@/utils/email/tokens'
import { sendEmail } from '@/utils/email/sender'
import { fetchVerseSnippetsForEmail } from '@/utils/bible-api'

// Variable paths that a generic broadcast can always supply.
// Templates referencing anything outside this set get a dedicated handler below
// or are rejected with a clear error.
const BROADCAST_INJECTABLE_PREFIXES = ['user', 'site_url', 'unsubscribe_link']

// Templates handled by dedicated logic (not the generic pre-flight):
//   daily-reminder  → per-user plan day variables
//   meeting-reminder → next upcoming meeting from the DB (+ default fallback)
//   weekly-digest   → last-7-days community activity counts

export async function sendBroadcast(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const recipientFilter = formData.get('recipient_filter') as string
  const templateId = formData.get('template_id') as string
  const customSubject = formData.get('custom_subject') as string
  const customBody = formData.get('custom_body') as string
  const fromEmail = (formData.get('from_email') as string) || undefined

  // Fetch recipients based on filter
  let query = supabase.from('user_profiles').select('user_id, email, full_name')

  if (recipientFilter === 'email_enabled') {
    // Only users who have email notifications enabled
    query = query.eq('email_notifications_enabled', true)
  } else if (recipientFilter === 'ci_updates') {
    // Only users who opted in for CI Updates
    query = query.eq('ci_updates', true)
  } else if (recipientFilter === 'bible_year') {
    // Only users who opted in for Bible in a Year
    query = query.eq('bible_year', true)
  } else if (recipientFilter === 'skill_share') {
    // Only users who opted in for Skill Share
    query = query.eq('skill_share', true)
  }

  const { data: recipients, error: fetchError } = await query

  if (fetchError || !recipients || recipients.length === 0) {
    return { error: 'No recipients found' }
  }

  // If using a template
  if (templateId && templateId !== 'custom') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://christiansinnovate.com'

    // ── Plan-aware templates (daily-reminder) ──────────────────────────────
    // Resolve per-user plan day variables so each recipient receives content
    // for the day they are currently on in their subscribed plan.
    if (templateId === 'daily-reminder') {
      // Use service client — we need to read across multiple users' subscriptions
      const serviceSupabase = createServiceClient()
      const today = new Date().toISOString().split('T')[0]
      const todayMs = new Date(today).getTime()
      const msPerDay = 86_400_000

      // Fetch subscriptions for all recipients
      const recipientIds = recipients.map((r) => r.user_id)
      const { data: subscriptions, error: subError } = await serviceSupabase
        .from('plan_subscriptions')
        .select('user_id, plan_id, subscribed_at')
        .in('user_id', recipientIds)

      if (subError || !subscriptions || subscriptions.length === 0) {
        return { error: 'No plan subscriptions found for these recipients. Make sure a default plan is set and recipients are subscribed.' }
      }

      // Determine each subscriber's current day number
      const subMap = new Map(
        subscriptions.map((s) => {
          const subscribedAtMs = new Date(s.subscribed_at as string).getTime()
          const dayNumber = Math.max(1, Math.floor((todayMs - subscribedAtMs) / msPerDay) + 1)
          return [s.user_id, { planId: s.plan_id, dayNumber }]
        })
      )

      // Collect the unique (plan_id, day_number) pairs we need to fetch
      const planDayKeys = [...new Set(
        [...subMap.values()].map((v) => `${v.planId}:${v.dayNumber}`)
      )]

      // Fetch all needed plan days in one query per plan
      const planIds = [...new Set([...subMap.values()].map((v) => v.planId))]
      const dayNumbers = [...new Set([...subMap.values()].map((v) => v.dayNumber))]

      const { data: planDays, error: daysError } = await serviceSupabase
        .from('plan_days')
        .select('id, plan_id, day_number, scripture_reference')
        .in('plan_id', planIds)
        .in('day_number', dayNumbers)

      if (daysError || !planDays || planDays.length === 0) {
        return { error: 'Could not load plan days. Make sure the plan has days created.' }
      }

      // Build a lookup: "planId:dayNumber" → plan_day row
      const dayLookup = new Map(
        planDays.map((d) => [`${d.plan_id}:${d.day_number}`, d])
      )

      // Fetch real verse text for all unique scripture references in one batch
      const verseSnippets = await fetchVerseSnippetsForEmail(
        planDays.map((d) => d.scripture_reference)
      )

      type ResolvedRecipient = {
        email: string
        userId: string
        variables: {
          user: { name: string; email: string; id: string }
          day: { number: number; title: string; scripture: string; link: string }
          site_url: string
        }
      }

      // Build per-recipient variable sets
      const resolvedRecipients: ResolvedRecipient[] = recipients
        .map((r) => {
          const sub = subMap.get(r.user_id)
          if (!sub) return null
          const key = `${sub.planId}:${sub.dayNumber}`
          const pd = dayLookup.get(key)
          if (!pd) return null
          const scriptureSnippet = verseSnippets.get(pd.scripture_reference) || pd.scripture_reference
          return {
            email: r.email,
            userId: r.user_id,
            variables: {
              user: { name: r.full_name, email: r.email, id: r.user_id },
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
        .filter((r): r is ResolvedRecipient => r !== null)

      if (resolvedRecipients.length === 0) {
        return { error: `No recipients could be matched to a plan day. Verify plan days exist for day numbers: ${planDayKeys.join(', ')}.` }
      }

      // Warn in the response if some recipients were skipped (no subscription / no day)
      const skipped = recipients.length - resolvedRecipients.length

      try {
        const result = await sendBatchEmails({
          recipients: resolvedRecipients,
          templateKey: templateId,
          subject: customSubject || undefined,
          from: fromEmail,
          metadata: { type: 'broadcast', filter: recipientFilter, strategy: 'plan-aware' },
        })
        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
          total: result.total,
          ...(skipped > 0 ? { warning: `${skipped} recipient(s) skipped — no active plan subscription or matching day found.` } : {}),
        }
      } catch (error) {
        console.error('Error sending daily-reminder broadcast:', error)
        return { error: error instanceof Error ? error.message : 'Failed to send broadcast' }
      }
    }

    // ── Meeting-aware templates (meeting-reminder) ─────────────────────────
    // Fetch the next upcoming (or active) meeting from the DB and inject its
    // details as meeting.* variables.  Falls back to a default Thursday-noon
    // Christians Innovate meeting when nothing is found.
    if (templateId === 'meeting-reminder') {
      const serviceSupabase = createServiceClient()
      const now = new Date().toISOString()

      // Try the soonest future meeting first, then fall back to the active one
      const { data: upcomingMeeting } = await serviceSupabase
        .from('meetings')
        .select('title, description, zoom_link, meeting_date')
        .gte('meeting_date', now)
        .order('meeting_date', { ascending: true })
        .limit(1)
        .single()

      let resolvedMeeting = upcomingMeeting
      if (!resolvedMeeting) {
        const { data: activeMeeting } = await serviceSupabase
          .from('meetings')
          .select('title, description, zoom_link, meeting_date')
          .eq('is_active', true)
          .order('meeting_date', { ascending: false })
          .limit(1)
          .single()
        resolvedMeeting = activeMeeting
      }

      // Helper — next Thursday date object in ET (used for the default fallback)
      const getNextThursdayET = (): Date => {
        const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
        const daysUntilThursday = (4 - etNow.getDay() + 7) % 7 || 7
        const next = new Date(etNow)
        next.setDate(etNow.getDate() + daysUntilThursday)
        next.setHours(12, 0, 0, 0)
        return next
      }

      const etDateFmt = (d: Date) =>
        d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
      const etTimeFmt = (d: Date) =>
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York' })

      let meetingVars: { title: string; date: string; time: string; description: string; zoom_link: string }
      let usedDefault = false

      if (resolvedMeeting) {
        const md = new Date(resolvedMeeting.meeting_date as string)
        meetingVars = {
          title: resolvedMeeting.title as string,
          date: etDateFmt(md),
          time: etTimeFmt(md),
          description: (resolvedMeeting.description as string | null) || 'Join us for our weekly Christians Innovate community meeting.',
          zoom_link: resolvedMeeting.zoom_link as string,
        }
      } else {
        usedDefault = true
        const nextThursday = getNextThursdayET()
        meetingVars = {
          title: 'Christians Innovate Thursday Meeting',
          date: etDateFmt(nextThursday),
          time: '12:00 PM Eastern Time',
          description: 'Join us for our weekly Christians Innovate community meeting.',
          zoom_link: siteUrl,
        }
      }

      const resolvedRecipients = recipients.map((r) => ({
        email: r.email,
        userId: r.user_id,
        variables: {
          user: { name: r.full_name, email: r.email, id: r.user_id },
          meeting: meetingVars,
          site_url: siteUrl,
        },
      }))

      try {
        const result = await sendBatchEmails({
          recipients: resolvedRecipients,
          templateKey: templateId,
          subject: customSubject || undefined,
          from: fromEmail,
          metadata: { type: 'broadcast', filter: recipientFilter, strategy: 'meeting-aware' },
        })
        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
          total: result.total,
          ...(usedDefault ? { warning: 'No upcoming meeting found in the database — used default "Christians Innovate Thursday Meeting" at 12 noon ET.' } : {}),
        }
      } catch (error) {
        console.error('Error sending meeting-reminder broadcast:', error)
        return { error: error instanceof Error ? error.message : 'Failed to send broadcast' }
      }
    }

    // ── Digest-aware templates (weekly-digest) ─────────────────────────────
    // Count community activity from the last 7 days and inject as digest.*
    // variables.  All recipients receive the same aggregate counts.
    if (templateId === 'weekly-digest') {
      const serviceSupabase = createServiceClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

      const { data: posts, error: postsError } = await serviceSupabase
        .from('launch_prayer_posts')
        .select('type')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .gte('created_at', sevenDaysAgo)

      if (postsError) {
        return { error: `Failed to load community activity: ${postsError.message}` }
      }

      const postList = posts ?? []
      const digestVars = {
        launches: postList.filter((p) => p.type === 'launch').length,
        prayers:  postList.filter((p) => p.type === 'prayer').length,
        wins:     postList.filter((p) => p.type === 'win').length,
      }

      const resolvedRecipients = recipients.map((r) => ({
        email: r.email,
        userId: r.user_id,
        variables: {
          user: { name: r.full_name, email: r.email, id: r.user_id },
          digest: digestVars,
          site_url: siteUrl,
        },
      }))

      try {
        const result = await sendBatchEmails({
          recipients: resolvedRecipients,
          templateKey: templateId,
          subject: customSubject || undefined,
          from: fromEmail,
          metadata: { type: 'broadcast', filter: recipientFilter, strategy: 'digest-aware' },
        })
        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
          total: result.total,
          ...(postList.length === 0 ? { warning: 'No community activity found in the last 7 days — digest counts will show 0.' } : {}),
        }
      } catch (error) {
        console.error('Error sending weekly-digest broadcast:', error)
        return { error: error instanceof Error ? error.message : 'Failed to send broadcast' }
      }
    }

    // ── Generic template pre-flight ────────────────────────────────────────
    // Reject templates that require variables a broadcast cannot supply
    const { data: tmpl } = await supabase
      .from('email_templates')
      .select('subject, body_html, name')
      .eq('template_key', templateId)
      .eq('is_active', true)
      .single()

    if (tmpl) {
      const allVars = extractTemplateVariables(tmpl.subject + '\n' + tmpl.body_html)
      const unsupported = allVars.filter(
        (v) => !BROADCAST_INJECTABLE_PREFIXES.some((prefix) => v === prefix || v.startsWith(prefix + '.'))
      )
      if (unsupported.length > 0) {
        return {
          error: `The "${tmpl.name ?? templateId}" template requires variables that aren't available in a broadcast: ${unsupported.join(', ')}. Use a template designed for broadcasts (e.g. welcome, announcement) or supply those values via a scheduled cron.`,
        }
      }
    }

    try {
      const result = await sendBatchEmails({
        recipients: recipients.map((r) => ({
          email: r.email,
          userId: r.user_id,
          variables: {
            user: {
              name: r.full_name,
              email: r.email,
              id: r.user_id,
            },
            site_url: siteUrl,
          },
        })),
        templateKey: templateId,
        subject: customSubject || undefined,
        from: fromEmail,
        metadata: {
          type: 'broadcast',
          filter: recipientFilter,
        },
      })

      return {
        success: true,
        sent: result.sent,
        failed: result.failed,
        total: result.total,
      }
    } catch (error) {
      console.error('Error sending broadcast:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send broadcast'
      return { error: errorMessage }
    }
  }

  // If custom email (not using template)
  if (customSubject && customBody) {
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        const unsubscribeLink = generateUnsubscribeUrl(
          recipient.user_id,
          recipient.email
        )

        // Replace variables in custom email
        const variables = {
          user: {
            name: recipient.full_name,
            email: recipient.email,
          },
          unsubscribe_link: unsubscribeLink,
        }

        const rendered = renderEmailTemplate(
          customSubject,
          customBody,
          null,
          variables
        )

        const result = await sendEmail({
          to: recipient.email,
          subject: rendered.subject,
          html: rendered.html,
          from: fromEmail,
          userId: recipient.user_id,
          metadata: {
            type: 'broadcast',
            filter: recipientFilter,
          },
        })

        if (result.success) {
          sent++
        } else {
          failed++
        }
      } catch (error) {
        console.error(`Error sending to ${recipient.email}:`, error)
        failed++
      }
    }

    return {
      success: true,
      sent,
      failed,
      total: recipients.length,
    }
  }

  return { error: 'Invalid email configuration' }
}

export async function sendTestEmail(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) return { error: 'Not authorized' }

  const testEmail = (formData.get('test_email') as string)?.trim()
  if (!testEmail) return { error: 'Test email address is required' }

  const templateId = formData.get('template_id') as string
  const customSubject = formData.get('custom_subject') as string
  const customBody = formData.get('custom_body') as string
  const fromEmail = (formData.get('from_email') as string) || undefined
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://christiansinnovate.com'

  // Use admin's own profile as the sample "user" for variable replacement
  const { data: adminProfile } = await supabase
    .from('user_profiles')
    .select('full_name, email')
    .eq('user_id', user.id)
    .single()

  const sampleUser = {
    name: adminProfile?.full_name || 'Test User',
    email: testEmail,
    id: user.id,
  }

  // Helper: send one recipient via sendBatchEmails (handles template rendering)
  const sendOne = async (variables: Record<string, unknown>) => {
    const result = await sendBatchEmails({
      recipients: [{ email: testEmail, userId: user.id, variables }],
      templateKey: templateId,
      subject: customSubject || undefined,
      from: fromEmail,
      metadata: { type: 'test' },
    })
    if ((result.failed ?? 0) > 0) return { error: 'Failed to send test email' }
    return { success: true }
  }

  if (templateId && templateId !== 'custom') {
    if (templateId === 'daily-reminder') {
      const serviceSupabase = createServiceClient()
      const today = new Date().toISOString().split('T')[0]
      const todayMs = new Date(today).getTime()

      const { data: sub } = await serviceSupabase
        .from('plan_subscriptions')
        .select('plan_id, subscribed_at')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!sub) {
        return { error: 'No plan subscription found for your account — subscribe to a plan first so sample day data can be resolved.' }
      }

      const dayNumber = Math.max(1, Math.floor((todayMs - new Date(sub.subscribed_at as string).getTime()) / 86_400_000) + 1)

      const { data: planDay } = await serviceSupabase
        .from('plan_days')
        .select('id, day_number, scripture_reference')
        .eq('plan_id', sub.plan_id)
        .eq('day_number', dayNumber)
        .single()

      const verseSnippets = planDay
        ? await fetchVerseSnippetsForEmail([planDay.scripture_reference])
        : new Map()

      return sendOne({
        user: sampleUser,
        day: {
          number: planDay?.day_number ?? dayNumber,
          title: planDay?.scripture_reference ?? 'Genesis 1',
          scripture: (planDay ? verseSnippets.get(planDay.scripture_reference) : null) ?? planDay?.scripture_reference ?? 'In the beginning...',
          link: planDay ? `${siteUrl}/dashboard/day/${planDay.id}` : siteUrl,
        },
        site_url: siteUrl,
      })
    }

    if (templateId === 'meeting-reminder') {
      const serviceSupabase = createServiceClient()
      const now = new Date().toISOString()

      const { data: upcomingMeeting } = await serviceSupabase
        .from('meetings')
        .select('title, description, zoom_link, meeting_date')
        .gte('meeting_date', now)
        .order('meeting_date', { ascending: true })
        .limit(1)
        .single()

      const getNextThursdayET = (): Date => {
        const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
        const daysUntilThursday = (4 - etNow.getDay() + 7) % 7 || 7
        const next = new Date(etNow)
        next.setDate(etNow.getDate() + daysUntilThursday)
        next.setHours(12, 0, 0, 0)
        return next
      }
      const etDateFmt = (d: Date) =>
        d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
      const etTimeFmt = (d: Date) =>
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York' })

      let meetingVars: { title: string; date: string; time: string; description: string; zoom_link: string }
      if (upcomingMeeting) {
        const md = new Date(upcomingMeeting.meeting_date as string)
        meetingVars = {
          title: upcomingMeeting.title as string,
          date: etDateFmt(md),
          time: etTimeFmt(md),
          description: (upcomingMeeting.description as string | null) || 'Join us for our weekly Christians Innovate community meeting.',
          zoom_link: upcomingMeeting.zoom_link as string,
        }
      } else {
        const nextThursday = getNextThursdayET()
        meetingVars = {
          title: 'Christians Innovate Thursday Meeting',
          date: etDateFmt(nextThursday),
          time: '12:00 PM Eastern Time',
          description: 'Join us for our weekly Christians Innovate community meeting.',
          zoom_link: siteUrl,
        }
      }

      return sendOne({ user: sampleUser, meeting: meetingVars, site_url: siteUrl })
    }

    if (templateId === 'weekly-digest') {
      const serviceSupabase = createServiceClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const { data: posts } = await serviceSupabase
        .from('launch_prayer_posts')
        .select('type')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .gte('created_at', sevenDaysAgo)

      const postList = posts ?? []
      return sendOne({
        user: sampleUser,
        digest: {
          launches: postList.filter((p) => p.type === 'launch').length,
          prayers: postList.filter((p) => p.type === 'prayer').length,
          wins: postList.filter((p) => p.type === 'win').length,
        },
        site_url: siteUrl,
      })
    }

    // Generic template
    return sendOne({ user: sampleUser, site_url: siteUrl })
  }

  // Custom email — render manually and use sendEmail directly
  if (!customSubject || !customBody) return { error: 'Subject and body are required' }

  const unsubscribeLink = generateUnsubscribeUrl(user.id, testEmail)
  const rendered = renderEmailTemplate(customSubject, customBody, null, {
    user: sampleUser,
    unsubscribe_link: unsubscribeLink,
  })

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: rendered.subject,
      html: rendered.html,
      from: fromEmail,
      userId: user.id,
      metadata: { type: 'test' },
    })
    if (!result.success) return { error: result.error || 'Failed to send test email' }
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send test email' }
  }
}

export async function getRecipientCount(filter: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  let query

  if (filter === 'all') {
    query = supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
  } else if (filter === 'email_enabled') {
    query = supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('email_notifications_enabled', true)
  } else if (filter === 'ci_updates') {
    query = supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('ci_updates', true)
  } else if (filter === 'bible_year') {
    query = supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('bible_year', true)
  } else if (filter === 'skill_share') {
    query = supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('skill_share', true)
  } else {
    return { count: 0 }
  }

  const { count, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { count: count || 0 }
}
