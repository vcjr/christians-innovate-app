'use server'

import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/email/sender'
import { revalidatePath } from 'next/cache'
import { SenderAddress, InboxMessage } from '@/utils/email/scheduled-jobs'

export async function getSenderAddresses() {
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

  const { data: addresses, error } = await supabase
    .from('sender_addresses')
    .select('*')
    .eq('is_active', true)
    .order('purpose')

  if (error) {
    return { error: error.message }
  }

  return { addresses: addresses as SenderAddress[] }
}

export async function getInboxMessages() {
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

  const { data: messages, error } = await supabase
    .from('inbox_messages')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(100)

  if (error) {
    return { error: error.message }
  }

  return { messages: messages as InboxMessage[] }
}

export async function sendFromInbox(formData: FormData) {
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

  const fromEmail = formData.get('from_email') as string
  const fromName = formData.get('from_name') as string
  const toEmail = formData.get('to_email') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string
  const sendAsMyself = formData.get('send_as_myself') === 'true'

  // If not sending as myself, verify sender address exists and is active
  if (!sendAsMyself) {
    const { data: senderAddress, error: senderError } = await supabase
      .from('sender_addresses')
      .select('*')
      .eq('email_address', fromEmail)
      .eq('is_active', true)
      .single()

    if (senderError || !senderAddress) {
      return { error: 'Invalid sender address' }
    }
  }

  try {
    // Send email via Resend
    const result = await sendEmail({
      to: toEmail,
      subject,
      html: body.replace(/\n/g, '<br>'),
      from: sendAsMyself && fromName ? `${fromName} <${fromEmail}>` : undefined,
      userId: user.id,
      metadata: {
        type: 'admin_inbox',
        from_address: fromEmail,
        send_as_myself: sendAsMyself,
        from_name: fromName || undefined,
      },
    })

    if (result.error) {
      return { error: result.error }
    }

    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
    return { error: errorMessage }
  }
}

export async function markAsRead(messageId: string) {
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

  const { error } = await supabase
    .from('inbox_messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/inbox')
  return { success: true }
}
