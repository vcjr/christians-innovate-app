'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Refresh the server count for both desktop and mobile navigation.
export function MessageCountRefresh({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      if (document.visibilityState !== 'visible' || refreshTimer) return
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined
        router.refresh()
      }, 200)
    }
    const supabase = createClient()
    const channel = supabase
      .channel(`navigation-messages-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
        filter: `sender_id=neq.${userId}`,
      }, refresh)
      .subscribe(status => {
        if (status === 'SUBSCRIBED') refresh()
      })

    // Recover missed events, including deployments without messages in Realtime.
    const interval = setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(refreshTimer)
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      void supabase.removeChannel(channel)
    }
  }, [router, userId])

  return null
}
