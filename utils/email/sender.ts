import { createClient } from '@/utils/supabase/server'
import { resend, getFromEmail, isValidEmail } from './client'
import { SendEmailParams, SendBatchEmailParams } from './types'

/**
 * Log an email to the database
 */
async function logEmail(params: {
  userId?: string
  recipientEmail: string
  templateKey?: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  status: 'sent' | 'failed' | 'pending'
  resendId?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('email_logs').insert({
      user_id: params.userId || null,
      recipient_email: params.recipientEmail,
      template_key: params.templateKey || null,
      subject: params.subject,
      body_html: params.bodyHtml || null,
      body_text: params.bodyText || null,
      status: params.status,
      resend_id: params.resendId || null,
      error_message: params.errorMessage || null,
      metadata: params.metadata || {},
    })

    if (error) {
      console.error('Failed to log email:', error)
    }
  } catch (error) {
    console.error('Exception while logging email:', error)
  }
}

/**
 * Send a single email via Resend
 * @param params - Email parameters
 * @returns Resend response with message ID or error
 */
export async function sendEmail(params: SendEmailParams) {
  const { to, subject, html, text, from, templateKey, userId, metadata } = params

  // Validate email addresses
  const recipients = Array.isArray(to) ? to : [to]
  const invalidEmails = recipients.filter((email) => !isValidEmail(email))

  if (invalidEmails.length > 0) {
    const error = `Invalid email address(es): ${invalidEmails.join(', ')}`
    console.error(error)

    // Log failure for each invalid email
    for (const email of invalidEmails) {
      await logEmail({
        userId,
        recipientEmail: email,
        templateKey,
        subject,
        bodyHtml: html,
        bodyText: text,
        status: 'failed',
        errorMessage: error,
        metadata,
      })
    }

    return {
      success: false,
      error,
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || getFromEmail(),
      to: recipients,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Resend API error:', error)

      // Log failure
      for (const email of recipients) {
        await logEmail({
          userId,
          recipientEmail: email,
          templateKey,
          subject,
          bodyHtml: html,
          bodyText: text,
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          metadata,
        })
      }

      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    // Log success
    for (const email of recipients) {
      await logEmail({
        userId,
        recipientEmail: email,
        templateKey,
        subject,
        bodyHtml: html,
        bodyText: text,
        status: 'sent',
        resendId: data?.id,
        metadata,
      })
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Exception while sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'

    // Log failure
    for (const email of recipients) {
      await logEmail({
        userId,
        recipientEmail: email,
        templateKey,
        subject,
        bodyHtml: html,
        bodyText: text,
        status: 'failed',
        errorMessage: errorMessage,
        metadata,
      })
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send batch emails via Resend
 * Note: Resend allows up to 100 recipients per batch
 * @param params - Batch email parameters
 * @returns Results for each email
 */
export async function sendBatchEmails(params: SendBatchEmailParams) {
  const { recipients, templateKey, subject: subjectOverride, from: fromOverride, metadata } = params

  // Fetch the template from database
  const supabase = await createClient()
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single()

  if (templateError || !template) {
    console.error('Template not found:', templateKey, templateError)
    return {
      success: false,
      error: `Template not found: ${templateKey}`,
    }
  }

  const results = []

  // Process in batches of 100 (Resend limit)
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100)

    for (const recipient of batch) {
      try {
        // Import template rendering here to avoid circular dependency
        const { renderEmailTemplate, getMissingVariables } = await import('./templates')
        const { generateUnsubscribeUrl } = await import('./tokens')

        // Add unsubscribe link if userId is available
        const variables = {
          ...recipient.variables,
          unsubscribe_link: recipient.userId
            ? generateUnsubscribeUrl(recipient.userId, recipient.email)
            : undefined,
        }

        // Guard: detect missing template variables before sending
        // unsubscribe_link is optional (external contacts may not have userId)
        const templateContent =
          (subjectOverride || template.subject) + '\n' + template.body_html
        const missingVars = getMissingVariables(templateContent, variables).filter(
          (v) => v !== 'unsubscribe_link'
        )

        if (missingVars.length > 0) {
          const errorMsg = `Email not sent — missing required template variables: ${missingVars.join(', ')}`
          console.warn(`[sendBatchEmails] Skipping ${recipient.email}: ${errorMsg}`)
          results.push({ email: recipient.email, success: false, error: errorMsg })
          continue
        }

        const rendered = renderEmailTemplate(
          subjectOverride || template.subject,
          template.body_html,
          template.body_text,
          variables
        )

        const result = await sendEmail({
          to: recipient.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          from: fromOverride,
          templateKey,
          userId: recipient.userId,
          metadata,
        })

        results.push({
          email: recipient.email,
          ...result,
        })
      } catch (error) {
        console.error('Error sending to', recipient.email, error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
        results.push({
          email: recipient.email,
          success: false,
          error: errorMessage,
        })
      }
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length

  return {
    success: failureCount === 0,
    total: recipients.length,
    sent: successCount,
    failed: failureCount,
    results,
  }
}
