import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessagingLayout } from '@/components/messages/MessagingLayout'
import { PenSquare } from 'lucide-react'
import Link from 'next/link'

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: rawConversations } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, last_message_at, last_message_preview, last_message_sender_id, status, requested_by, created_at')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  const conversations = rawConversations || []

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

  // Fetch unread counts per conversation via server-side aggregate RPC
  const unreadByConv = new Map<string, number>()
  const { data: unreadCounts } = await supabase.rpc('get_unread_message_counts')
  for (const row of (unreadCounts || [])) {
    unreadByConv.set(row.conversation_id, Number(row.unread_count))
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
      latestMessage: c.last_message_preview
        ? { content: c.last_message_preview, created_at: c.last_message_at, sender_id: c.last_message_sender_id ?? null }
        : null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
      status: (c.status as 'pending' | 'accepted') ?? 'accepted',
      requestedBy: c.requested_by ?? null,
    }
  })

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-[14px] border-b border-gray-100">
        <h1 className="text-base font-bold text-gray-900">Messaging</h1>
        <Link
          href="/directory"
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Start a new conversation"
        >
          <PenSquare className="h-[18px] w-[18px]" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ConversationList conversations={enrichedConversations} currentUserId={user.id} />
      </div>
    </div>
  )

  return (
    <MessagingLayout sidebar={sidebar}>
      {children}
    </MessagingLayout>
  )
}
