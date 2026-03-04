import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { resend } from '@/utils/email/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Admin-only: verify the caller is authenticated and is an admin
  const supabase = createServiceClient()

  // Read auth header for cron-style calls, OR check session for browser calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCronCall) {
    // Browser call — verify admin session via cookie
    const cookieHeader = request.headers.get('cookie') || ''
    // We use the service client to look up the user from the session token
    // passed as a custom header from the client fetch
    const userToken = request.headers.get('x-user-token')
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!role?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    void cookieHeader // suppress unused warning
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) {
    return NextResponse.json(
      { error: 'RESEND_AUDIENCE_ID environment variable is not set' },
      { status: 500 }
    )
  }

  let appSynced = 0
  let appFailed = 0
  let externalSynced = 0
  let externalFailed = 0

  // ── Pass 1: Sync app members (user_profiles) ────────────────────────────

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, email, full_name, resend_contact_id, email_notifications_enabled')
    .not('email', 'is', null)

  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError)
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
  }

  for (const profile of profiles ?? []) {
    if (!profile.email) continue

    const nameParts = (profile.full_name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const unsubscribed = profile.email_notifications_enabled === false

    try {
      if (profile.resend_contact_id) {
        // Already synced — update to keep in sync
        await resend.contacts.update({
          audienceId,
          id: profile.resend_contact_id,
          firstName,
          lastName,
          unsubscribed,
        })
      } else {
        // New contact — create in Resend
        const { data, error } = await resend.contacts.create({
          audienceId,
          email: profile.email,
          firstName,
          lastName,
          unsubscribed,
        })

        if (error) throw new Error(error.message)

        // Store resend_contact_id back in Supabase
        if (data?.id) {
          await supabase
            .from('user_profiles')
            .update({ resend_contact_id: data.id })
            .eq('user_id', profile.user_id)
        }
      }

      appSynced++
    } catch (err) {
      console.error(`Failed to sync app member ${profile.email}:`, err)
      appFailed++
    }
  }

  // ── Pass 2: Sync external contacts ──────────────────────────────────────

  const { data: externals, error: externalsError } = await supabase
    .from('external_contacts')
    .select('id, email, first_name, last_name, resend_contact_id, is_unsubscribed')

  if (externalsError) {
    console.error('Error fetching external contacts:', externalsError)
    // Don't fail entirely — return partial results
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch external contacts',
      appSynced,
      appFailed,
    })
  }

  const now = new Date().toISOString()

  for (const contact of externals ?? []) {
    try {
      if (contact.resend_contact_id) {
        // Already synced — update
        await resend.contacts.update({
          audienceId,
          id: contact.resend_contact_id,
          firstName: contact.first_name || '',
          lastName: contact.last_name || '',
          unsubscribed: contact.is_unsubscribed,
        })

        await supabase
          .from('external_contacts')
          .update({ last_synced_at: now })
          .eq('id', contact.id)
      } else {
        // New contact — create in Resend
        const { data, error } = await resend.contacts.create({
          audienceId,
          email: contact.email,
          firstName: contact.first_name || '',
          lastName: contact.last_name || '',
          unsubscribed: contact.is_unsubscribed,
        })

        if (error) throw new Error(error.message)

        // Store resend_contact_id + last_synced_at
        await supabase
          .from('external_contacts')
          .update({
            resend_contact_id: data?.id ?? null,
            last_synced_at: now,
          })
          .eq('id', contact.id)
      }

      externalSynced++
    } catch (err) {
      console.error(`Failed to sync external contact ${contact.email}:`, err)
      externalFailed++
    }
  }

  return NextResponse.json({
    success: true,
    appSynced,
    appFailed,
    externalSynced,
    externalFailed,
    total: appSynced + externalSynced,
  })
}
