import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MessageThread } from '@/components/messages/MessageThread'
import { markConversationRead } from '../actions'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params

  // Validate conversationId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(conversationId)) return notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Verify the current user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, status, requested_by')
    .eq('id', conversationId)
    .single()

  if (!conversation) return notFound()

  const isParticipant =
    conversation.participant_1 === user.id || conversation.participant_2 === user.id
  if (!isParticipant) return notFound()

  // Fetch the other participant's profile
  const otherId =
    conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1

  const { data: otherProfile } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url')
    .eq('user_id', otherId)
    .single()

  // Fetch initial messages (most recent 50)
  const PAGE_SIZE = 50
  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, sender_id, content, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(PAGE_SIZE)

  const initialMessages = rawMessages || []

  // Mark incoming messages as read server-side (only when conversation is accepted)
  if (conversation.status === 'accepted') {
    await markConversationRead(conversationId)
  }

  return (
    <MessageThread
      key={conversationId}
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={{
        user_id: otherId,
        full_name: otherProfile?.full_name ?? null,
        avatar_url: otherProfile?.avatar_url ?? null,
      }}
      initialMessages={initialMessages}
      hasMore={initialMessages.length === PAGE_SIZE}
      conversationStatus={(conversation.status as 'pending' | 'accepted') ?? 'accepted'}
      requestedBy={conversation.requested_by ?? null}
    />
  )
}
