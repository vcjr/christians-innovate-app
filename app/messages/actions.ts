'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// ============================================================
// Helper: find an existing conversation between two users.
// Returns { id, status } or null if none exists.
// ============================================================
async function findConversation(userId1: string, userId2: string) {
  const supabase = await createClient()
  const [p1, p2] = [userId1, userId2].sort()

  const { data } = await supabase
    .from('conversations')
    .select('id, status')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .single()

  return data ?? null
}

// ============================================================
// Send a message request to another user.
// Creates a pending conversation and notifies the recipient.
// If a conversation already exists (any status), navigates to it.
// ============================================================
export async function sendMessageRequest(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const existing = await findConversation(user.id, otherUserId)
  if (existing) {
    redirect(`/messages/${existing.id}`)
  }

  const [p1, p2] = [user.id, otherUserId].sort()

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2, status: 'pending', requested_by: user.id })
    .select('id')
    .single()

  if (error || !conv) {
    throw new Error(error?.message || 'Failed to create conversation')
  }

  // Fetch sender name for the notification
  const { data: senderProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  const senderName = senderProfile?.full_name || 'Someone'

  await supabase.rpc('create_notification_for_user', {
    p_user_id: otherUserId,
    p_type: 'message_request',
    p_title: `${senderName} wants to connect`,
    p_message: 'Accept their message request to start chatting.',
    p_link: `/messages/${conv.id}`,
    p_reference_id: conv.id,
  })

  redirect(`/messages/${conv.id}`)
}

// ============================================================
// Navigate to an existing accepted conversation from the directory.
// Only called when the conversation is already accepted.
// ============================================================
export async function navigateToConversation(conversationId: string) {
  redirect(`/messages/${conversationId}`)
}

// ============================================================
// Accept a pending message request (recipient only).
// ============================================================
export async function acceptMessageRequest(conversationId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('accept_message_request', {
    p_conversation_id: conversationId,
  })

  if (error) {
    console.error('Error accepting message request:', error)
    return { error: error.message }
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)
  return { success: true }
}

// ============================================================
// Decline / cancel a pending message request (either participant).
// Deletes the conversation — the requester can send a new one later.
// ============================================================
export async function declineMessageRequest(conversationId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('decline_message_request', {
    p_conversation_id: conversationId,
  })

  if (error) {
    console.error('Error declining message request:', error)
    return { error: error.message }
  }

  redirect('/messages')
}

// ============================================================
// Send a message (only works when conversation is accepted).
// ============================================================
export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message cannot be empty' }
  if (trimmed.length > 4000) return { error: 'Message too long (max 4000 characters)' }

  // Verify participant AND conversation is accepted
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, status')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id)) {
    return { error: 'Conversation not found' }
  }

  if (conversation.status !== 'accepted') {
    return { error: 'Cannot send messages until the request is accepted' }
  }

  const { error: msgError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content: trimmed })

  if (msgError) {
    console.error('Error sending message:', msgError)
    return { error: msgError.message || 'Failed to send message' }
  }

  const messagePreview = trimmed.length > 100 ? trimmed.slice(0, 97) + '…' : trimmed
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: messagePreview,
      last_message_sender_id: user.id,
    })
    .eq('id', conversationId)

  const recipientId = conversation.participant_1 === user.id
    ? conversation.participant_2
    : conversation.participant_1

  const { data: senderProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  const senderName = senderProfile?.full_name || 'Someone'
  const preview = trimmed.length > 100 ? trimmed.slice(0, 97) + '…' : trimmed

  await supabase.rpc('upsert_message_notification', {
    p_user_id: recipientId,
    p_title: `New message from ${senderName}`,
    p_message: preview,
    p_link: `/messages/${conversationId}`,
    p_reference_id: conversationId,
  })

  revalidatePath(`/messages/${conversationId}`)
  return { success: true }
}

// ============================================================
// Mark all messages in a conversation as read for the current user
// ============================================================
export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  await supabase.rpc('dismiss_message_notifications', {
    p_conversation_id: conversationId,
  })
}

// ============================================================
// Load earlier messages for infinite scroll (cursor-based)
// ============================================================
export async function loadEarlierMessages(conversationId: string, beforeCursor: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { messages: [], hasMore: false }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id)) {
    return { messages: [], hasMore: false }
  }

  const PAGE_SIZE = 50

  const { data: olderMessages } = await supabase
    .from('messages')
    .select('id, sender_id, content, is_read, created_at')
    .eq('conversation_id', conversationId)
    .lt('created_at', beforeCursor)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  const msgs = (olderMessages || []).reverse()
  return { messages: msgs, hasMore: msgs.length === PAGE_SIZE }
}
