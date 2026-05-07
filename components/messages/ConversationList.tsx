'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { MessageSquare, Search } from 'lucide-react'
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
    sender_id: string | null
  } | null
  unreadCount: number
  status: 'pending' | 'accepted'
  requestedBy: string | null
}

interface ConversationListProps {
  conversations: ConversationItem[]
  currentUserId: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState<ConversationItem[]>(conversations)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setItems(conversations)
  }, [conversations])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('conversations-list-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'conversations' },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(c => (c.otherUser.full_name || '').toLowerCase().includes(q))
  }, [items, search])

  if (items.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <MessageSquare className="h-9 w-9 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600 mb-1">No conversations yet</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Visit the{' '}
          <Link href="/directory" className="text-blue-600 hover:underline">
            Directory
          </Link>{' '}
          to start messaging members.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      {items.length > 1 && (
        <div className="px-3 pt-2 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 && search.trim() ? (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-gray-400">No conversations matching &quot;{search}&quot;</p>
        </div>
      ) : (
        <ul className="py-1">
          {filtered.map(conv => {
            const isActive = pathname === `/messages/${conv.id}`
            const hasUnread = conv.unreadCount > 0

            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.otherUser.avatar_url ? (
                      <Image
                        src={conv.otherUser.avatar_url}
                        alt={conv.otherUser.full_name || 'User'}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover aspect-square"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm select-none">
                        {(conv.otherUser.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`text-sm truncate ${hasUnread || isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.otherUser.full_name || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-2">
                        {conv.latestMessage && (
                          <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                            {timeAgo(conv.latestMessage.created_at)}
                          </span>
                        )}
                        {conv.status === 'pending' ? (
                          <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {conv.requestedBy === currentUserId ? 'Sent' : 'Request'}
                          </span>
                        ) : (
                          hasUnread && (
                            <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                              {conv.unreadCount}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    {conv.latestMessage ? (
                      <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {conv.latestMessage.sender_id === currentUserId ? 'You: ' : ''}
                        {conv.latestMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5 italic">No messages yet</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
