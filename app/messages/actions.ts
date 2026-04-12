'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// ============================================================
// Helper: get or create a conversation between two users.
// Normalises the pair so participant_1 is always the
// lexicographically-smaller UUID, enforcing the UNIQUE constraint.
// ============================================================
async function getOrCreateConversation(currentUserId: string, otherUserId: string) {
  const supabase = await createClient()

  const [p1, p2] = [currentUserId, otherUserId].sort()

  // Try to find an existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .single()

  if (existing) return existing.id

  // Create a new one
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2 })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(error?.message || 'Failed to create conversation')
  }

  return created.id
}

// ============================================================
// Start or navigate to a DM with another user
// ============================================================
export async function startConversation(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const conversationId = await getOrCreateConversation(user.id, otherUserId)
  redirect(`/messages/${conversationId}`)
}

// ============================================================
// Send a message
// ============================================================
export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message cannot be empty' }
  if (trimmed.length > 4000) return { error: 'Message too long (max 4000 characters)' }

  // Verify the user is a participant in this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id)) {
    return { error: 'Conversation not found' }
  }

  const { error: msgError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content: trimmed })

  if (msgError) {
    console.error('Error sending message:', msgError)
    return { error: msgError.message || 'Failed to send message' }
  }

  // Bump last_message_at on the conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

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

  // Mark all messages sent by the other party as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)
}
