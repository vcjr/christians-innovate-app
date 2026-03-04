'use server'

import { createServiceClient } from '@/utils/supabase/server'
import { resend } from '@/utils/email/client'

export async function unsubscribeFromEmails(userId: string) {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({
        email_notifications_enabled: false,
        daily_reminder_enabled: false,
        meeting_reminder_enabled: false,
        weekly_digest_enabled: false,
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error unsubscribing user:', error)
      return { error: 'Failed to unsubscribe. Please try again or contact support.' }
    }

    // Also mark unsubscribed in Resend Audience if synced
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('resend_contact_id')
        .eq('user_id', userId)
        .single()

      if (profile?.resend_contact_id) {
        try {
          await resend.contacts.update({
            audienceId,
            id: profile.resend_contact_id,
            unsubscribed: true,
          })
        } catch (err) {
          console.error('Failed to update Resend contact on unsubscribe:', err)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception while unsubscribing:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function unsubscribeExternalContact(email: string) {
  try {
    const supabase = createServiceClient()

    // Fetch first to get resend_contact_id before updating
    const { data: contact } = await supabase
      .from('external_contacts')
      .select('resend_contact_id')
      .eq('email', email)
      .single()

    const { error } = await supabase
      .from('external_contacts')
      .update({ is_unsubscribed: true })
      .eq('email', email)

    if (error) {
      console.error('Error unsubscribing external contact:', error)
      return { error: 'Failed to unsubscribe. Please try again or contact support.' }
    }

    // Also mark unsubscribed in Resend Audience if synced
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId && contact?.resend_contact_id) {
      try {
        await resend.contacts.update({
          audienceId,
          id: contact.resend_contact_id,
          unsubscribed: true,
        })
      } catch (err) {
        console.error('Failed to update Resend contact on external unsubscribe:', err)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception while unsubscribing external contact:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

