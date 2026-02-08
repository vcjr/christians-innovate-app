'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// ============================================
// GROUP MANAGEMENT ACTIONS
// ============================================

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is already in a group
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (existingProfile?.accountability_group_id) {
    return { error: 'You are already in an accountability group' }
  }

  const name = formData.get('name') as string
  const targetObjective = formData.get('target_objective') as string

  if (!name || !targetObjective) {
    return { error: 'Group name and target objective are required' }
  }

  // Create the group
  const { data: newGroup, error: groupError } = await supabase
    .from('accountability_groups')
    .insert({
      name,
      target_objective: targetObjective,
      created_by: user.id,
    })
    .select()
    .single()

  if (groupError) {
    console.error('Error creating group:', groupError)
    throw new Error(groupError.message || 'Failed to create group')
  }

  // Add creator to the group
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ accountability_group_id: newGroup.id })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    throw new Error(updateError.message || 'Failed to join group')
  }

  revalidatePath('/accountability')
  revalidatePath('/dashboard')
  redirect('/accountability')
}

export async function updateGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const groupId = formData.get('group_id') as string
  const name = formData.get('name') as string
  const targetObjective = formData.get('target_objective') as string

  if (!groupId || !name || !targetObjective) {
    return { error: 'All fields are required' }
  }

  // Verify user is the group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== user.id) {
    return { error: 'Only the group creator can update the group' }
  }

  const { error } = await supabase
    .from('accountability_groups')
    .update({
      name,
      target_objective: targetObjective,
    })
    .eq('id', groupId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accountability')
  return { success: true }
}

export async function leaveGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's current group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    return { error: 'You are not in a group' }
  }

  // Remove user from group
  const { error } = await supabase
    .from('user_profiles')
    .update({ accountability_group_id: null })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Check if group is now empty and delete if so
  const { data: remainingMembers } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('accountability_group_id', profile.accountability_group_id)

  if (remainingMembers && remainingMembers.length === 0) {
    await supabase
      .from('accountability_groups')
      .delete()
      .eq('id', profile.accountability_group_id)
  }

  revalidatePath('/accountability')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// MEMBER MANAGEMENT ACTIONS
// ============================================

export async function removeMember(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const memberUserId = formData.get('member_user_id') as string

  if (!memberUserId) {
    throw new Error('Member user ID is required')
  }

  // Get current user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    throw new Error('Not in an accountability group')
  }

  // Verify current user is the group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', profile.accountability_group_id)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can remove members')
  }

  if (memberUserId === user.id) {
    throw new Error('Cannot remove yourself. Use "Leave Group" instead')
  }

  // Remove member from group
  const { error } = await supabase
    .from('user_profiles')
    .update({ accountability_group_id: null })
    .eq('user_id', memberUserId)
    .eq('accountability_group_id', profile.accountability_group_id)

  if (error) {
    throw new Error(error.message || 'Failed to remove member')
  }

  revalidatePath('/accountability')
}

export async function transferOwnership(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const newOwnerId = formData.get('new_owner_id') as string

  if (!newOwnerId) {
    throw new Error('New owner ID is required')
  }

  // Get current user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    throw new Error('Not in an accountability group')
  }

  // Verify current user is the group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', profile.accountability_group_id)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can transfer ownership')
  }

  // Verify new owner is in the same group
  const { data: newOwnerProfile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', newOwnerId)
    .single()

  if (newOwnerProfile?.accountability_group_id !== profile.accountability_group_id) {
    throw new Error('New owner must be a member of the group')
  }

  // Transfer ownership
  const { error } = await supabase
    .from('accountability_groups')
    .update({ created_by: newOwnerId, updated_at: new Date().toISOString() })
    .eq('id', profile.accountability_group_id)

  if (error) {
    throw new Error(error.message || 'Failed to transfer ownership')
  }

  revalidatePath('/accountability')
}

// ============================================
// COMMITMENT ACTIONS
// ============================================

export async function createCommitment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const commitmentText = formData.get('commitment_text') as string
  const dueDateStr = formData.get('due_date') as string

  if (!commitmentText) {
    return { error: 'Commitment text is required' }
  }

  // Get user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    return { error: 'You are not in a group' }
  }

  const insertData: Record<string, string | null> = {
    group_id: profile.accountability_group_id,
    user_id: user.id,
    commitment_text: commitmentText,
    status: 'active',
    due_date: dueDateStr
      ? new Date(dueDateStr).toISOString()
      : (() => {
        // Default to end of current week (Sunday)
        const now = new Date();
        const daysUntilSunday = 7 - now.getDay();
        const sunday = new Date(now);
        sunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
        sunday.setHours(23, 59, 59, 999);
        return sunday.toISOString();
      })(),
  }

  const { error } = await supabase
    .from('group_commitments')
    .insert(insertData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accountability')
  return { success: true }
}

export async function updateCommitmentStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const commitmentId = formData.get('commitment_id') as string
  const status = formData.get('status') as 'active' | 'completed' | 'sacrificed'

  if (!commitmentId || !status) {
    return { error: 'Commitment ID and status are required' }
  }

  const updateData: Record<string, string> = { status }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('group_commitments')
    .update(updateData)
    .eq('id', commitmentId)
    .eq('user_id', user.id) // Ensure user owns this commitment

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accountability')
  return { success: true }
}

export async function deleteCommitment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const commitmentId = formData.get('commitment_id') as string

  if (!commitmentId) {
    return { error: 'Commitment ID is required' }
  }

  const { error } = await supabase
    .from('group_commitments')
    .delete()
    .eq('id', commitmentId)
    .eq('user_id', user.id) // Ensure user owns this commitment

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accountability')
  return { success: true }
}

// ============================================
// RHYTHM MANAGEMENT ACTIONS
// ============================================

export async function updateRhythmConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const frequency = formData.get('frequency') as string
  const day = formData.get('day') as string
  const time = formData.get('time') as string

  if (!frequency || !day || !time) {
    throw new Error('Frequency, day, and time are required')
  }

  // Get user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    throw new Error('Not in an accountability group')
  }

  // Verify user is the group creator (only creator can change rhythm)
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', profile.accountability_group_id)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can change the rhythm')
  }

  // Update rhythm config
  const { error } = await supabase
    .from('accountability_groups')
    .update({
      rhythm_config: { frequency, day, time },
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.accountability_group_id)

  if (error) {
    throw new Error(error.message || 'Failed to update rhythm configuration')
  }

  revalidatePath('/accountability')
  return { success: true }
}

// ============================================
// DEBRIEF SESSION ACTIONS
// ============================================

export async function saveReflection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const reflectionNotes = formData.get('reflection_notes') as string
  const hardQuestionResponse = formData.get('hard_question_response') as string

  if (!reflectionNotes) {
    throw new Error('Reflection notes are required')
  }

  // Get user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    throw new Error('Not in an accountability group')
  }

  // Check if there's already a reflection for today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingSession } = await supabase
    .from('debrief_sessions')
    .select('id')
    .eq('group_id', profile.accountability_group_id)
    .eq('facilitator_id', user.id)
    .eq('session_date', today)
    .single()

  if (existingSession) {
    // Update existing session
    const { error } = await supabase
      .from('debrief_sessions')
      .update({
        reflection_notes: reflectionNotes,
        hard_question_response: hardQuestionResponse,
      })
      .eq('id', existingSession.id)

    if (error) {
      throw new Error(error.message || 'Failed to update reflection')
    }
  } else {
    // Create new session
    const { error } = await supabase
      .from('debrief_sessions')
      .insert({
        group_id: profile.accountability_group_id,
        facilitator_id: user.id,
        hard_question_response: hardQuestionResponse,
        reflection_notes: reflectionNotes,
        session_date: today
      })

    if (error) {
      throw new Error(error.message || 'Failed to save reflection')
    }
  }

  revalidatePath('/accountability')
  return { success: true }
}

export async function getTodayReflection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's group
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    return null
  }

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('debrief_sessions')
    .select('*')
    .eq('group_id', profile.accountability_group_id)
    .eq('facilitator_id', user.id)
    .eq('session_date', today)
    .single()

  return data
}

// ============================================
// COMMITMENT ENHANCEMENT ACTIONS
// ============================================

export async function updateCommitment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const commitmentId = formData.get('commitment_id') as string
  const commitmentText = formData.get('commitment_text') as string
  const dueDate = formData.get('due_date') as string

  if (!commitmentId) {
    throw new Error('Commitment ID is required')
  }

  // Verify ownership
  const { data: commitment } = await supabase
    .from('group_commitments')
    .select('user_id')
    .eq('id', commitmentId)
    .single()

  if (commitment?.user_id !== user.id) {
    throw new Error('Not authorized to update this commitment')
  }

  const updateData: Record<string, string> = {}
  if (commitmentText) updateData.commitment_text = commitmentText
  if (dueDate) updateData.due_date = dueDate

  const { error } = await supabase
    .from('group_commitments')
    .update(updateData)
    .eq('id', commitmentId)

  if (error) {
    throw new Error(error.message || 'Failed to update commitment')
  }

  revalidatePath('/accountability')
  return { success: true }
}

// ============================================
// INVITATION & NOTIFICATION ACTIONS
// ============================================

export async function sendGroupInvitation(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get current user's group and name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile?.accountability_group_id) {
    return { error: 'You are not in an accountability group' }
  }

  // Verify user is group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by, name')
    .eq('id', profile.accountability_group_id)
    .single()

  if (group?.created_by !== user.id) {
    return { error: 'Only the group creator can send invitations' }
  }

  // Check if target user is already in a group
  const { data: targetProfile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', targetUserId)
    .single()

  if (targetProfile?.accountability_group_id) {
    return { error: 'This user is already in an accountability group' }
  }

  // Check for existing invitation
  const { data: existingInvite } = await supabase
    .from('group_invitations')
    .select('id, status')
    .eq('group_id', profile.accountability_group_id)
    .eq('invited_user_id', targetUserId)
    .single()

  if (existingInvite?.status === 'pending') {
    return { error: 'An invitation has already been sent to this user' }
  }

  // If a previous invitation was declined, delete it so we can re-invite
  if (existingInvite) {
    await supabase
      .from('group_invitations')
      .delete()
      .eq('id', existingInvite.id)
  }

  // Create invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('group_invitations')
    .insert({
      group_id: profile.accountability_group_id,
      invited_by: user.id,
      invited_user_id: targetUserId,
      status: 'pending',
    })
    .select()
    .single()

  if (inviteError) {
    console.error('Error creating invitation:', inviteError)
    return { error: inviteError.message || 'Failed to send invitation' }
  }

  // Create notification for the invited user
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${profile.full_name || 'Someone'} invited you to join "${group.name}"`,
      link: '/accountability',
      reference_id: invitation.id,
    })

  if (notifError) {
    console.error('Error creating notification:', notifError)
  }

  revalidatePath('/accountability')
  revalidatePath('/directory')
  return { success: true }
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.rpc('accept_group_invitation', {
    invitation_id: invitationId,
  })

  if (error) {
    console.error('Error accepting invitation:', error)
    return { error: error.message || 'Failed to accept invitation' }
  }

  revalidatePath('/accountability')
  revalidatePath('/directory')
  return { success: true }
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update invitation status
  const { error } = await supabase
    .from('group_invitations')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('invited_user_id', user.id)

  if (error) {
    console.error('Error declining invitation:', error)
    return { error: error.message || 'Failed to decline invitation' }
  }

  // Mark notification as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('reference_id', invitationId)
    .eq('user_id', user.id)

  revalidatePath('/accountability')
  return { success: true }
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count || 0
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function dismissNotification(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
}

export async function clearAllNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)

  revalidatePath('/')
}