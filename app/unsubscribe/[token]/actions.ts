'use server'

import { createClient } from '@/utils/supabase/server'

export async function unsubscribeFromEmails(userId: string) {
  try {
    const supabase = await createClient()

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

    return { success: true }
  } catch (error) {
    console.error('Exception while unsubscribing:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
