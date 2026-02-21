'use server'

import { createClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'
import { renderEmailTemplate } from '@/utils/email/templates'
import { generateUnsubscribeUrl } from '@/utils/email/tokens'
import { sendEmail } from '@/utils/email/sender'

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
          },
        })),
        templateKey: templateId,
        subject: customSubject || undefined,
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
