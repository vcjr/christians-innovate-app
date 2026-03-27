import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

// Webhook endpoint to receive incoming emails from Resend
// Documentation: https://resend.com/docs/api-reference/webhooks/email-received

// Optional: Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signature) {
    // If no secret is configured, skip verification (not recommended for production)
    return true
  }

  // TODO: Implement Resend webhook signature verification
  // Resend uses HMAC-SHA256 for webhook signatures
  // Example implementation:
  // const crypto = require('crypto')
  // const hmac = crypto.createHmac('sha256', secret)
  // const digest = hmac.update(payload).digest('hex')
  // return digest === signature

  return true
}

export async function POST(request: Request) {
  try {
    // Get the raw body for verification
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    // Optional: Verify webhook signature
    const signature = request.headers.get('x-resend-signature')
    const isValid = verifyWebhookSignature(
      bodyText,
      signature,
      process.env.RESEND_WEBHOOK_SECRET
    )

    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Resend sends email.received events
    if (body.type !== 'email.received') {
      return NextResponse.json(
        { error: 'Unsupported event type' },
        { status: 400 }
      )
    }

    const emailData = body.data

    // Extract email information
    const from = emailData.from
    const to = emailData.to
    const subject = emailData.subject
    const html = emailData.html
    const text = emailData.text
    const headers = emailData.headers || {}
    const attachments = emailData.attachments || []
    
    // Parse from field (can be in format "Name <email@domain.com>" or just "email@domain.com")
    let fromEmail = from
    let fromName = null
    
    const emailMatch = from.match(/<(.+)>/)
    if (emailMatch) {
      fromEmail = emailMatch[1]
      fromName = from.replace(/<.+>/, '').trim()
    }

    // Parse to field (can be array or string)
    const toEmail = Array.isArray(to) ? to[0] : to

    // Reply-to header
    const replyTo = headers['reply-to'] || fromEmail

    // Use service role client to bypass RLS for webhook
    const supabase = createServiceClient()

    // Insert into inbox_messages table
    const { data: message, error } = await supabase
      .from('inbox_messages')
      .insert({
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmail,
        reply_to: replyTo,
        subject: subject || null,
        body_html: html || null,
        body_text: text || null,
        headers: headers,
        attachments: attachments,
        is_read: false,
        received_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving incoming email:', error)
      return NextResponse.json(
        { error: 'Failed to save email' },
        { status: 500 }
      )
    }

    // Return success
    return NextResponse.json({
      success: true,
      message_id: message.id,
      from: fromEmail,
      to: toEmail,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify webhook is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Resend inbound email webhook endpoint',
    timestamp: new Date().toISOString(),
  })
}
