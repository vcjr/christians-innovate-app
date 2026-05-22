'use client'

import { useState, useEffect, useRef, useTransition, useCallback, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, ChevronUp, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage, loadEarlierMessages } from '@/app/messages/actions'
import { MessageRequestBanner } from './MessageRequestBanner'

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
  hasMore: boolean
  conversationStatus: 'pending' | 'accepted'
  requestedBy: string | null
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

// Auto-link URLs in message content
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g

function sanitizeHttpUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}

function linkifyContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(URL_REGEX.source, 'g')
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const url = match[0]
    const safeUrl = sanitizeHttpUrl(url)
    if (safeUrl) {
      parts.push(
        <a
          key={match.index}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:opacity-80"
        >
          {url}
        </a>
      )
    } else {
      parts.push(url)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : text
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
  hasMore: initialHasMore,
  conversationStatus,
  requestedBy,
}: MessageThreadProps) {
  const router = useRouter()
  const [status, setStatus] = useState(conversationStatus)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  // Real-time subscription for incoming messages and read receipts
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
            // If this is our own message arriving via realtime, replace the optimistic entry
            if (incoming.sender_id === currentUserId) {
              const hasOptimistic = prev.some(m => m.id.startsWith('optimistic-'))
              if (hasOptimistic) {
                // Replace the first optimistic message with the real one
                let replaced = false
                return prev.map(m => {
                  if (!replaced && m.id.startsWith('optimistic-')) {
                    replaced = true
                    return incoming
                  }
                  return m
                })
              }
            }
            return [...prev, incoming]
          })
          // Refresh to update read status server-side
          if (incoming.sender_id !== currentUserId) {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'accepted') {
            setStatus('accepted')
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        () => {
          router.replace('/messages')
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

  const handleLoadEarlier = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)

    const container = messagesContainerRef.current
    const scrollHeightBefore = container?.scrollHeight ?? 0

    const oldest = messages[0]
    const result = await loadEarlierMessages(conversationId, oldest.created_at)

    if (result.messages.length > 0) {
      setMessages(prev => [...result.messages, ...prev])
    }
    setHasMore(result.hasMore)
    setLoadingMore(false)

    // Preserve scroll position after prepending
    requestAnimationFrame(() => {
      if (container) {
        const scrollHeightAfter = container.scrollHeight
        container.scrollTop = scrollHeightAfter - scrollHeightBefore
      }
    })
  }, [loadingMore, hasMore, messages, conversationId])

  // Find the last own message for read receipt
  const lastOwnMessage = [...messages].reverse().find(m => m.sender_id === currentUserId && !m.id.startsWith('optimistic-'))

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        {/* Back arrow — mobile only */}
        <Link
          href="/messages"
          className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser.avatar_url ? (
          <Image
            src={otherUser.avatar_url}
            alt={otherUser.full_name || 'User'}
            width={38}
            height={38}
            className="w-[38px] h-[38px] rounded-full object-cover aspect-square flex-shrink-0"
          />
        ) : (
          <div className="w-[38px] h-[38px] rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0 select-none">
            {(otherUser.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {otherUser.full_name || 'Unknown User'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${otherUser.full_name || 'user'}`}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-1.5 bg-gray-50/40"
      >
        {status === 'pending' ? (
          <MessageRequestBanner
            conversationId={conversationId}
            isRequester={requestedBy === currentUserId}
            otherUserName={otherUser.full_name ?? 'this person'}
            onAccepted={() => {
              setStatus('accepted')
              router.refresh()
            }}
          />
        ) : (
          <>
            {/* Load earlier messages */}
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button
                  onClick={handleLoadEarlier}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow transition disabled:opacity-50"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  {loadingMore ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400 text-center">
                  No messages yet. Say hello!
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId
              const isLastOwn = lastOwnMessage?.id === msg.id
              return (
                <Fragment key={msg.id}>
                  <div
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    role="listitem"
                  >
                    <div
                      className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                    >
                      <p>{linkifyContent(msg.content)}</p>
                      <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {formatMessageTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                  {/* Read receipt on last own message */}
                  {isOwn && isLastOwn && (
                    <div className="flex justify-end pr-1">
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                        {msg.is_read ? (
                          <>
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                            <span>Seen</span>
                            <span className="sr-only">Message has been read</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Sent</span>
                            <span className="sr-only">Message sent, not yet read</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </Fragment>
              )
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Compose */}
      {status === 'accepted' && (
        <div className="flex-shrink-0 bg-white px-4 py-3">
          <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message…"
              aria-label={`Message to ${otherUser.full_name || 'user'}`}
              rows={1}
              maxLength={4000}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-28 overflow-y-auto leading-normal"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isPending}
              className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )
}
