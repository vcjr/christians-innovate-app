import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { ConversationList } from '@/components/messages/ConversationList'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch all conversations the user is part of, ordered by most recent message
  const { data: rawConversations } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, last_message_at, created_at')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  const conversations = rawConversations || []

  // Collect the IDs of the other participants to fetch their profiles
  const otherUserIds = [...new Set(
    conversations.map(c => c.participant_1 === user.id ? c.participant_2 : c.participant_1)
  )]

  const { data: profiles } = otherUserIds.length > 0
    ? await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', otherUserIds)
    : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] }

  const profilesById = new Map((profiles || []).map(p => [p.user_id, p]))

  // Fetch the latest message + unread count for each conversation
  const conversationIds = conversations.map(c => c.id)

  const { data: latestMessages } = conversationIds.length > 0
    ? await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, is_read, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
    : { data: [] as { id: string; conversation_id: string; sender_id: string; content: string; is_read: boolean; created_at: string }[] }

  // Build a map of latest message per conversation
  const latestByConv = new Map<string, { content: string; created_at: string; sender_id: string }>()
  const unreadByConv = new Map<string, number>()

  for (const msg of (latestMessages || [])) {
    if (!latestByConv.has(msg.conversation_id)) {
      latestByConv.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      })
    }
    if (msg.sender_id !== user.id && !msg.is_read) {
      unreadByConv.set(msg.conversation_id, (unreadByConv.get(msg.conversation_id) ?? 0) + 1)
    }
  }

  const enrichedConversations = conversations.map(c => {
    const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1
    const profile = profilesById.get(otherId)
    return {
      id: c.id,
      last_message_at: c.last_message_at,
      otherUser: {
        user_id: otherId,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      latestMessage: latestByConv.get(c.id) ?? null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Messages
          </h1>
          <p className="text-gray-600 mt-1">Direct messages with other members</p>
        </header>

        <ConversationList
          conversations={enrichedConversations}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
