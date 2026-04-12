'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MessageSquare, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface ConversationItem {
  id: string
  last_message_at: string
  otherUser: {
    user_id: string
    full_name: string | null
    avatar_url: string | null
  }
  latestMessage: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
}

interface ConversationListProps {
  conversations: ConversationItem[]
  currentUserId: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const router = useRouter()
  const [items, setItems] = useState<ConversationItem[]>(conversations)

  // Keep list in sync when server props update
  useEffect(() => {
    setItems(conversations)
  }, [conversations])

  // Real-time: bump a conversation to the top when a new message arrives
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('conversations-list-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Start a conversation by visiting the{' '}
            <Link href="/directory" className="text-blue-600 hover:underline">
              Directory
            </Link>{' '}
            and clicking &quot;Message&quot; on a member&apos;s card.
          </p>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Users className="h-4 w-4" />
            Browse Directory
          </Link>
        </div>
      ) : (
        <ul>
          {items.map((conv, idx) => (
            <li key={conv.id} className={idx !== items.length - 1 ? 'border-b border-gray-100' : ''}>
              <Link
                href={`/messages/${conv.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition ${
                  conv.unreadCount > 0 ? 'bg-blue-50/40' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  {conv.otherUser.avatar_url ? (
                    <Image
                      src={conv.otherUser.avatar_url}
                      alt={conv.otherUser.full_name || 'User'}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {(conv.otherUser.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                      {conv.otherUser.full_name || 'Unknown User'}
                    </p>
                    {conv.latestMessage && (
                      <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                        {timeAgo(conv.latestMessage.created_at)}
                      </span>
                    )}
                  </div>
                  {conv.latestMessage ? (
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {conv.latestMessage.sender_id === currentUserId ? 'You: ' : ''}
                      {conv.latestMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5 italic">No messages yet</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
