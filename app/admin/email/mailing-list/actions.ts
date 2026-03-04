'use server'

import { createClient, createServiceClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { resend } from '@/utils/email/client'

export async function syncContactsToResend() {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: role } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!role?.is_admin) return { success: false, error: 'Not authorized' }

  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) return { success: false, error: 'RESEND_AUDIENCE_ID is not configured' }

  const service = createServiceClient()
  let appSynced = 0, appFailed = 0, externalSynced = 0, externalFailed = 0

  // ── Pass 1: App members ──────────────────────────────────────────────────
  const { data: profiles } = await service
    .from('user_profiles')
    .select('user_id, email, full_name, resend_contact_id, email_notifications_enabled')
    .not('email', 'is', null)

  for (const profile of profiles ?? []) {
    if (!profile.email) continue
    const nameParts = (profile.full_name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const unsubscribed = profile.email_notifications_enabled === false

    try {
      if (profile.resend_contact_id) {
        await resend.contacts.update({ audienceId, id: profile.resend_contact_id, firstName, lastName, unsubscribed })
      } else {
        const { data, error } = await resend.contacts.create({ audienceId, email: profile.email, firstName, lastName, unsubscribed })
        if (error) throw new Error(error.message)
        if (data?.id) {
          await service.from('user_profiles').update({ resend_contact_id: data.id }).eq('user_id', profile.user_id)
        }
      }
      appSynced++
    } catch (err) {
      console.error(`Resend sync failed for app member ${profile.email}:`, err)
      appFailed++
    }
  }

  // ── Pass 2: External contacts ────────────────────────────────────────────
  const { data: externals } = await service
    .from('external_contacts')
    .select('id, email, first_name, last_name, resend_contact_id, is_unsubscribed')

  const now = new Date().toISOString()

  for (const contact of externals ?? []) {
    try {
      if (contact.resend_contact_id) {
        await resend.contacts.update({
          audienceId,
          id: contact.resend_contact_id,
          firstName: contact.first_name || '',
          lastName: contact.last_name || '',
          unsubscribed: contact.is_unsubscribed,
        })
        await service.from('external_contacts').update({ last_synced_at: now }).eq('id', contact.id)
      } else {
        const { data, error } = await resend.contacts.create({
          audienceId,
          email: contact.email,
          firstName: contact.first_name || '',
          lastName: contact.last_name || '',
          unsubscribed: contact.is_unsubscribed,
        })
        if (error) throw new Error(error.message)
        await service.from('external_contacts').update({ resend_contact_id: data?.id ?? null, last_synced_at: now }).eq('id', contact.id)
      }
      externalSynced++
    } catch (err) {
      console.error(`Resend sync failed for external contact ${contact.email}:`, err)
      externalFailed++
    }
  }

  revalidatePath('/admin/email/mailing-list')
  return {
    success: true,
    appSynced,
    appFailed,
    externalSynced,
    externalFailed,
    total: appSynced + externalSynced,
  }
}
