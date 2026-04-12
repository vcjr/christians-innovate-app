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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Verify the current user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2')
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
  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, sender_id, content, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50)

  // Mark incoming messages as read server-side
  await markConversationRead(conversationId)

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={{
        user_id: otherId,
        full_name: otherProfile?.full_name ?? null,
        avatar_url: otherProfile?.avatar_url ?? null,
      }}
      initialMessages={rawMessages || []}
    />
  )
}
