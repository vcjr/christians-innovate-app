'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createMeeting(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const zoomLink = formData.get('zoom_link') as string
  const meetingDate = formData.get('meeting_date') as string
  const isActive = formData.get('is_active') === 'true'

  // If activating this meeting, deactivate all others first
  if (isActive) {
    await supabase
      .from('meetings')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all meetings
  }

  const { error } = await supabase
    .from('meetings')
    .insert({
      title,
      description: description || null,
      zoom_link: zoomLink,
      meeting_date: meetingDate,
      is_active: isActive,
      created_by: user.id
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateMeeting(meetingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const zoomLink = formData.get('zoom_link') as string
  const meetingDate = formData.get('meeting_date') as string
  const isActive = formData.get('is_active') === 'true'

  // If activating this meeting, deactivate all others first
  if (isActive) {
    await supabase
      .from('meetings')
      .update({ is_active: false })
      .neq('id', meetingId)
  }

  const { error } = await supabase
    .from('meetings')
    .update({
      title,
      description: description || null,
      zoom_link: zoomLink,
      meeting_date: meetingDate,
      is_active: isActive
    })
    .eq('id', meetingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function toggleMeetingActive(meetingId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const newStatus = !currentStatus

  // If activating this meeting, deactivate all others first
  if (newStatus) {
    await supabase
      .from('meetings')
      .update({ is_active: false })
      .neq('id', meetingId)
  }

  const { error } = await supabase
    .from('meetings')
    .update({ is_active: newStatus })
    .eq('id', meetingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteMeeting(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    .from('meetings')
    .delete()
    .eq('id', meetingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function duplicateMeeting(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Get the original meeting
  const { data: meeting, error: fetchError } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (fetchError || !meeting) {
    return { error: 'Meeting not found' }
  }

  // Create a copy
  const { error: insertError } = await supabase
    .from('meetings')
    .insert({
      title: `${meeting.title} (Copy)`,
      description: meeting.description,
      zoom_link: meeting.zoom_link,
      meeting_date: meeting.meeting_date,
      is_active: false,
      created_by: user.id
    })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/meetings')
  return { success: true }
}

export async function addManualAttendee(meetingId: string, userEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Find user by email
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .ilike('email', userEmail)
    .single()

  if (!userProfile) {
    return { error: 'User not found with that email' }
  }

  // Add attendance record
  const { error } = await supabase
    .from('meeting_attendance')
    .insert({
      meeting_id: meetingId,
      user_id: userProfile.user_id
    })

  if (error && error.code !== '23505') { // Ignore duplicate errors
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  return { success: true }
}

export async function removeAttendee(meetingId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    .from('meeting_attendance')
    .delete()
    .match({ meeting_id: meetingId, user_id: userId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/meetings')
  return { success: true }
}
