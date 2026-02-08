'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { markNotificationRead, dismissNotification, clearAllNotifications } from '@/app/accountability/actions'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [cleared, setCleared] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const visibleNotifications = cleared
    ? []
    : notifications
        .filter(n => !dismissedIds.has(n.id))
        .map(n => readIds.has(n.id) ? { ...n, is_read: true } : n)

  const displayUnreadCount = cleared
    ? 0
    : visibleNotifications.filter(n => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read && !readIds.has(notification.id)) {
      setReadIds(prev => new Set(prev).add(notification.id))
      await markNotificationRead(notification.id)
    }
    setIsOpen(false)
    if (notification.link) {
      router.push(notification.link)
      router.refresh()
    }
  }

  const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    setDismissedIds(prev => new Set(prev).add(notificationId))
    await dismissNotification(notificationId)
    router.refresh()
  }

  const handleClearAll = async () => {
    setCleared(true)
    await clearAllNotifications()
    router.refresh()
  }

  const [now] = useState(() => Date.now())

  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {displayUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] px-1">
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {visibleNotifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      !notification.is_read ? 'bg-blue-500' : 'bg-transparent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 pr-6">{notification.title}</p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 pr-6">{notification.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(e, notification.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
