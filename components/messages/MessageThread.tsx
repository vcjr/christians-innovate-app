'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/messages/actions'

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface OtherUser {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  otherUser: OtherUser
  initialMessages: Message[]
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep messages in sync when server re-renders
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription for incoming messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-live-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates from optimistic updates
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
          // Refresh to update read status server-side
          if (incoming.sender_id !== currentUserId) {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, router])

  const handleSend = () => {
    const content = draft.trim()
    if (!content || isPending) return
    setError(null)

    // Optimistic update
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])
    setDraft('')

    startTransition(async () => {
      const result = await sendMessage(conversationId, content)
      if (result?.error) {
        setError(result.error)
        // Roll back optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setDraft(content)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link
          href="/messages"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser.avatar_url ? (
          <Image
            src={otherUser.avatar_url}
            alt={otherUser.full_name || 'User'}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
            {(otherUser.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {otherUser.full_name || 'Unknown User'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                  {formatMessageTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isPending}
            className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  )
}
