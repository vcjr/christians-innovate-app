'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DayCard } from './day-card'
import { SortControls } from './sort-controls'
import { ArrowRight } from 'lucide-react'
import { getPlanDays } from './actions'
import type { PlanDay } from './types'

type SortOption = 'newest' | 'oldest' | 'day-asc' | 'day-desc'

interface ReadingProgressProps {
  initialDays: PlanDay[]
  planId: string
  hasMore: boolean
}

export function ReadingProgress({ initialDays, planId, hasMore: initialHasMore }: ReadingProgressProps) {
  const [days, setDays] = useState<PlanDay[]>(initialDays)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('day-asc')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  const nextIncompleteDay = [...days]
    .sort((a, b) => a.day_number - b.day_number)
    .find((day) => !day.user_progress?.[0]?.is_completed)

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return
    isLoadingRef.current = true
    setIsLoading(true)
    const nextPage = page + 1
    try {
      const result = await getPlanDays(planId, nextPage, 10)
      setDays((prev) => [...prev, ...result.days])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [hasMore, page, planId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '100px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const sortedDays = [...days].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'day-asc':
        return a.day_number - b.day_number
      case 'day-desc':
        return b.day_number - a.day_number
      default:
        return 0
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Your Reading Progress</h3>
      </div>

      {/* Up Next Section */}
      {nextIncompleteDay && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            <h4 className="text-base font-semibold text-gray-900">Up Next</h4>
          </div>
          <div className="ring-2 ring-blue-500 ring-offset-2 rounded-lg">
            <DayCard day={nextIncompleteDay} isCompleted={false} />
          </div>
        </div>
      )}

      <SortControls currentSort={sortBy} onSortChange={setSortBy} />

      <div className="space-y-3 sm:space-y-4">
        {sortedDays.length > 0 ? (
          sortedDays.map((day) => {
            const isCompleted = day.user_progress?.[0]?.is_completed || false
            return <DayCard key={day.id} day={day} isCompleted={isCompleted} />
          })
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              No daily readings available yet for this plan.
            </p>
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            Loading more days...
          </div>
        )}
        {!hasMore && days.length > 0 && (
          <p className="text-xs text-gray-400">
            All {days.length} day{days.length !== 1 ? 's' : ''} loaded
          </p>
        )}
      </div>
    </div>
  )
}
