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

  // Add creator to the group via junction table
  const { error: membershipError } = await supabase
    .from('user_group_memberships')
    .insert({ user_id: user.id, group_id: newGroup.id })

  if (membershipError) {
    console.error('Error adding creator to group:', membershipError)
    throw new Error(membershipError.message || 'Failed to join group')
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
    .update({ name, target_objective: targetObjective })
    .eq('id', groupId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accountability')
  return { success: true }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is actually in this group
  const { data: membership } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .single()

  if (!membership) {
    return { error: 'You are not in this group' }
  }

  // Prevent creator from leaving while other members remain (orphan protection)
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by === user.id) {
    const { data: otherMembers } = await supabase
      .from('user_group_memberships')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', user.id)

    if (otherMembers && otherMembers.length > 0) {
      return { error: 'Transfer ownership to another member before leaving the group' }
    }
  }

  // Get group name + leaving user profile before deleting
  const [{ data: groupInfo }, { data: leavingProfile }] = await Promise.all([
    supabase.from('accountability_groups').select('name, created_by').eq('id', groupId).single(),
    supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
  ])

  // Remove user from group
  const { error } = await supabase
    .from('user_group_memberships')
    .delete()
    .eq('user_id', user.id)
    .eq('group_id', groupId)

  if (error) {
    return { error: error.message }
  }

  // Delete the group if it is now empty
  const { data: remainingMembers } = await supabase
    .from('user_group_memberships')
    .select('user_id')
    .eq('group_id', groupId)

  if (remainingMembers && remainingMembers.length === 0) {
    await supabase
      .from('accountability_groups')
      .delete()
      .eq('id', groupId)
  } else if (groupInfo && groupInfo.created_by !== user.id) {
    // Notify the group creator that a member left
    await supabase.from('notifications').insert({
      user_id: groupInfo.created_by,
      type: 'member_left',
      title: 'Member Left Group',
      message: `${leavingProfile?.full_name || 'A member'} has left "${groupInfo.name}"`,
      link: '/accountability',
    })
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
  const groupId = formData.get('group_id') as string

  if (!memberUserId || !groupId) {
    throw new Error('Member user ID and group ID are required')
  }

  // Verify current user is the group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can remove members')
  }

  if (memberUserId === user.id) {
    throw new Error('Cannot remove yourself. Use "Leave Group" instead')
  }

  // Get group name for notification
  const { data: groupInfo } = await supabase
    .from('accountability_groups')
    .select('name')
    .eq('id', groupId)
    .single()

  // Remove member from junction table
  const { error } = await supabase
    .from('user_group_memberships')
    .delete()
    .eq('user_id', memberUserId)
    .eq('group_id', groupId)

  if (error) {
    throw new Error(error.message || 'Failed to remove member')
  }

  // Notify the removed member
  if (groupInfo) {
    await supabase.from('notifications').insert({
      user_id: memberUserId,
      type: 'member_removed',
      title: 'Removed from Group',
      message: `You have been removed from "${groupInfo.name}"`,
      link: '/accountability',
    })
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
  const groupId = formData.get('group_id') as string

  if (!newOwnerId || !groupId) {
    throw new Error('New owner ID and group ID are required')
  }

  // Verify current user is the group creator
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can transfer ownership')
  }

  // Verify new owner is in the same group
  const { data: newOwnerMembership } = await supabase
    .from('user_group_memberships')
    .select('user_id')
    .eq('user_id', newOwnerId)
    .eq('group_id', groupId)
    .single()

  if (!newOwnerMembership) {
    throw new Error('New owner must be a member of the group')
  }

  // Get group name + current owner profile for notification
  const [{ data: groupInfo }, { data: currentOwnerProfile }] = await Promise.all([
    supabase.from('accountability_groups').select('name').eq('id', groupId).single(),
    supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
  ])

  // Transfer ownership
  const { error } = await supabase
    .from('accountability_groups')
    .update({ created_by: newOwnerId, updated_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) {
    throw new Error(error.message || 'Failed to transfer ownership')
  }

  // Notify the new owner
  if (groupInfo) {
    await supabase.from('notifications').insert({
      user_id: newOwnerId,
      type: 'ownership_transferred',
      title: 'You Are Now Group Owner',
      message: `${currentOwnerProfile?.full_name || 'The previous owner'} made you the owner of "${groupInfo.name}"`,
      link: '/accountability',
    })
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
  const groupId = formData.get('group_id') as string

  if (!commitmentText) {
    return { error: 'Commitment text is required' }
  }

  if (!groupId) {
    return { error: 'Group ID is required' }
  }

  // Verify user is a member of this group
  const { data: membership } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .single()

  if (!membership) {
    return { error: 'You are not in this group' }
  }

  const insertData: Record<string, string | null> = {
    group_id: groupId,
    user_id: user.id,
    commitment_text: commitmentText,
    status: 'active',
    due_date: dueDateStr
      ? new Date(dueDateStr).toISOString()
      : (() => {
        // Default to end of current week (Sunday). When today is Sunday, daysUntilSunday = 0 (end of today).
        const now = new Date()
        const daysUntilSunday = (7 - now.getDay()) % 7
        const sunday = new Date(now)
        sunday.setDate(now.getDate() + daysUntilSunday)
        sunday.setHours(23, 59, 59, 999)
        return sunday.toISOString()
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

  // Clear completed_at when reverting away from completed; set it when completing
  const updateData: Record<string, string | null> = { status }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_at = null
  }

  const { error } = await supabase
    .from('group_commitments')
    .update(updateData)
    .eq('id', commitmentId)
    .eq('user_id', user.id)

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
    .eq('user_id', user.id)

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
  const day2 = (formData.get('day2') as string) || null
  const time = formData.get('time') as string
  const time2 = (formData.get('time2') as string) || null
  const groupId = formData.get('group_id') as string

  if (!frequency || !day || !time || !groupId) {
    throw new Error('Frequency, day, time, and group ID are required')
  }

  // Verify user is the group creator (only creator can change rhythm)
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== user.id) {
    throw new Error('Only the group creator can change the rhythm')
  }

  // Get group name for notifications
  const { data: groupInfo } = await supabase
    .from('accountability_groups')
    .select('name')
    .eq('id', groupId)
    .single()

  const { error } = await supabase
    .from('accountability_groups')
    .update({
      rhythm_config: { frequency, day, time, ...(day2 ? { day2, time2: time2 || time } : {}) },
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)

  if (error) {
    throw new Error(error.message || 'Failed to update rhythm configuration')
  }

  // Notify all other group members about the schedule change
  if (groupInfo) {
    const { data: otherMembers } = await supabase
      .from('user_group_memberships')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', user.id)

    if (otherMembers && otherMembers.length > 0) {
      await supabase.from('notifications').insert(
        otherMembers.map(m => ({
          user_id: m.user_id,
          type: 'rhythm_updated',
          title: 'Meeting Schedule Updated',
          message: `"${groupInfo.name}" now meets ${frequency} on ${day2 ? `${day}s & ${day2}s` : `${day}s`} at ${time}`,
          link: '/accountability',
        }))
      )
    }
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
  const groupId = formData.get('group_id') as string

  if (!reflectionNotes) {
    throw new Error('Reflection notes are required')
  }

  if (!groupId) {
    throw new Error('Group ID is required')
  }

  // Verify user is a member of this group
  const { data: membership } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .single()

  if (!membership) {
    throw new Error('You are not in this group')
  }

  // Check if there's already a reflection for today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingSession } = await supabase
    .from('debrief_sessions')
    .select('id')
    .eq('group_id', groupId)
    .eq('facilitator_id', user.id)
    .eq('session_date', today)
    .single()

  if (existingSession) {
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
    const { error } = await supabase
      .from('debrief_sessions')
      .insert({
        group_id: groupId,
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

  const { data: membership } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership?.group_id) {
    return null
  }

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('debrief_sessions')
    .select('*')
    .eq('group_id', membership.group_id)
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
  // Convert YYYY-MM-DD from <input type="date"> to ISO timestamp to match TIMESTAMPTZ column
  if (dueDate) updateData.due_date = new Date(dueDate).toISOString()

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

export async function sendGroupInvitation(targetUserId: string, groupId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get current user's display name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  let resolvedGroupId = groupId

  if (!resolvedGroupId) {
    // Auto-select the first group the caller is creator of
    const { data: ownedGroup } = await supabase
      .from('accountability_groups')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .single()

    if (!ownedGroup) {
      return { error: 'You are not the creator of any accountability group' }
    }
    resolvedGroupId = ownedGroup.id
  }

  // Verify user is the creator of the target group
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('created_by, name')
    .eq('id', resolvedGroupId)
    .single()

  if (group?.created_by !== user.id) {
    return { error: 'Only the group creator can send invitations' }
  }

  // Block if target is already a member of this specific group
  const { data: existingMembership } = await supabase
    .from('user_group_memberships')
    .select('user_id')
    .eq('user_id', targetUserId)
    .eq('group_id', resolvedGroupId)
    .single()

  if (existingMembership) {
    return { error: 'This user is already a member of this group' }
  }

  // Check for an existing invitation to this group
  const { data: existingInvite } = await supabase
    .from('group_invitations')
    .select('id, status')
    .eq('group_id', resolvedGroupId)
    .eq('invited_user_id', targetUserId)
    .single()

  if (existingInvite?.status === 'pending') {
    return { error: 'An invitation has already been sent to this user for this group' }
  }

  // If a previous invite was declined, delete it so we can re-invite
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
      group_id: resolvedGroupId,
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

  // Notify the invited user
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${profile?.full_name || 'Someone'} invited you to join "${group.name}"`,
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

  // Fetch invitation details before accepting (for notification)
  const { data: invitation } = await supabase
    .from('group_invitations')
    .select('invited_by, group_id, accountability_groups(name)')
    .eq('id', invitationId)
    .single()

  const { error } = await supabase.rpc('accept_group_invitation', {
    invitation_id: invitationId,
  })

  if (error) {
    console.error('Error accepting invitation:', error)
    return { error: error.message || 'Failed to accept invitation' }
  }

  // Notify the inviter
  if (invitation) {
    const groupName = (invitation.accountability_groups as any)?.name || 'your group'
    const { data: accepterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: invitation.invited_by,
      type: 'invitation_accepted',
      title: 'Invitation Accepted',
      message: `${accepterProfile?.full_name || 'Someone'} accepted your invitation to join "${groupName}"`,
      link: '/accountability',
      reference_id: invitationId,
    })
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

  const { error } = await supabase
    .from('group_invitations')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('invited_user_id', user.id)

  if (error) {
    console.error('Error declining invitation:', error)
    return { error: error.message || 'Failed to decline invitation' }
  }

  // Fetch invitation details for notification
  const { data: invitation } = await supabase
    .from('group_invitations')
    .select('invited_by, accountability_groups(name)')
    .eq('id', invitationId)
    .single()

  // Mark notification as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('reference_id', invitationId)
    .eq('user_id', user.id)

  // Notify the inviter
  if (invitation) {
    const groupName = (invitation.accountability_groups as any)?.name || 'your group'
    const { data: declinerProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: invitation.invited_by,
      type: 'invitation_declined',
      title: 'Invitation Declined',
      message: `${declinerProfile?.full_name || 'Someone'} declined your invitation to join "${groupName}"`,
      link: '/directory',
      reference_id: invitationId,
    })
  }

  revalidatePath('/accountability')
  revalidatePath('/directory')
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

// ============================================
// JOIN REQUEST ACTIONS
// ============================================

export async function requestToJoinGroup(groupId: string, message?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Block if already a member
  const { data: existing } = await supabase
    .from('user_group_memberships')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .single()

  if (existing) return { error: 'You are already a member of this group' }

  // Block duplicate pending request
  const { data: existingRequest } = await supabase
    .from('group_join_requests')
    .select('id, status')
    .eq('requester_id', user.id)
    .eq('group_id', groupId)
    .single()

  if (existingRequest?.status === 'pending') return { error: 'You already have a pending request for this group' }

  // Remove old rejected request so we can re-request
  if (existingRequest) {
    await supabase.from('group_join_requests').delete().eq('id', existingRequest.id)
  }

  const { data: request, error: reqError } = await supabase
    .from('group_join_requests')
    .insert({ group_id: groupId, requester_id: user.id, message: message || null })
    .select()
    .single()

  if (reqError) return { error: reqError.message || 'Failed to send request' }

  // Get requester profile and group info for notification
  const [{ data: profile }, { data: group }] = await Promise.all([
    supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
    supabase.from('accountability_groups').select('name, created_by').eq('id', groupId).single(),
  ])

  if (group) {
    await supabase.from('notifications').insert({
      user_id: group.created_by,
      type: 'join_request',
      title: 'New Join Request',
      message: `${profile?.full_name || 'Someone'} wants to join "${group.name}"`,
      link: '/accountability',
      reference_id: request.id,
    })
  }

  revalidatePath('/accountability/discover')
  revalidatePath('/accountability')
  return { success: true }
}

export async function approveJoinRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.rpc('approve_join_request', { request_id: requestId })
  if (error) return { error: error.message || 'Failed to approve request' }

  // Get request to notify requester
  const { data: req } = await supabase
    .from('group_join_requests')
    .select('requester_id, group_id, accountability_groups(name)')
    .eq('id', requestId)
    .single()

  if (req) {
    const groupName = (req.accountability_groups as any)?.name || 'the group'
    await supabase.from('notifications').insert({
      user_id: req.requester_id,
      type: 'join_request_approved',
      title: 'Join Request Approved',
      message: `Your request to join "${groupName}" has been approved!`,
      link: '/accountability',
      reference_id: requestId,
    })
  }

  revalidatePath('/accountability')
  revalidatePath('/accountability/discover')
  return { success: true }
}

export async function rejectJoinRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: req } = await supabase
    .from('group_join_requests')
    .select('requester_id, group_id, accountability_groups(name)')
    .eq('id', requestId)
    .single()

  const { error } = await supabase
    .from('group_join_requests')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('group_id', (req as any)?.group_id)

  if (error) return { error: error.message || 'Failed to reject request' }

  if (req) {
    const groupName = (req.accountability_groups as any)?.name || 'a group'
    await supabase.from('notifications').insert({
      user_id: req.requester_id,
      type: 'join_request_rejected',
      title: 'Join Request Declined',
      message: `Your request to join "${groupName}" was not approved at this time.`,
      link: '/accountability/discover',
      reference_id: requestId,
    })
  }

  revalidatePath('/accountability')
  revalidatePath('/accountability/discover')
  return { success: true }
}

export async function cancelJoinRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('group_join_requests')
    .delete()
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message || 'Failed to cancel request' }

  revalidatePath('/accountability/discover')
  return { success: true }
}
