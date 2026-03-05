'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SiblingDay {
  id: string
  day_number: number
}

interface DayNavigationProps {
  prevDay: SiblingDay | null
  nextDay: SiblingDay | null
  currentDayNumber: number
  totalDays: number
}

export function DayNavigation({
  prevDay,
  nextDay,
  currentDayNumber,
  totalDays,
}: DayNavigationProps) {
  const router = useRouter()

  // Keyboard navigation: left/right arrow keys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowLeft' && prevDay) {
        router.push(`/dashboard/day/${prevDay.id}`)
      } else if (e.key === 'ArrowRight' && nextDay) {
        router.push(`/dashboard/day/${nextDay.id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevDay, nextDay, router])

  const prevHref = prevDay ? `/dashboard/day/${prevDay.id}` : null
  const nextHref = nextDay ? `/dashboard/day/${nextDay.id}` : null

  return (
    <>
      {/* Desktop: Floating side arrows in the gutters */}
      <div className="hidden xl:block">
        {/* Previous day - left gutter */}
        <div className="fixed top-1/2 -translate-y-1/2 left-[calc(50%-32rem-4rem)]">
          {prevHref ? (
            <Link
              href={prevHref}
              className="group flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              aria-label={`Go to Day ${prevDay!.day_number}`}
              title={`Day ${prevDay!.day_number}`}
            >
              <ChevronLeft className="h-5 w-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
            </Link>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-100 opacity-30 cursor-not-allowed">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Next day - right gutter */}
        <div className="fixed top-1/2 -translate-y-1/2 right-[calc(50%-32rem-4rem)]">
          {nextHref ? (
            <Link
              href={nextHref}
              className="group flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              aria-label={`Go to Day ${nextDay!.day_number}`}
              title={`Day ${nextDay!.day_number}`}
            >
              <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
            </Link>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-100 opacity-30 cursor-not-allowed">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet: Sticky bottom navigation bar */}
      <div className="fixed bottom-0 inset-x-0 xl:hidden z-50">
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Previous button */}
            {prevHref ? (
              <Link
                href={prevHref}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={`Go to Day ${prevDay!.day_number}`}
              >
                <ChevronLeft className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Day {prevDay!.day_number}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 opacity-40 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                  Prev
                </span>
              </div>
            )}

            {/* Center: Day indicator */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-gray-900">
                Day {currentDayNumber}
              </span>
              <span className="text-xs text-gray-500">
                of {totalDays}
              </span>
            </div>

            {/* Next button */}
            {nextHref ? (
              <Link
                href={nextHref}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                aria-label={`Go to Day ${nextDay!.day_number}`}
              >
                <span className="text-sm font-medium text-white hidden sm:inline">
                  Day {nextDay!.day_number}
                </span>
                <ChevronRight className="h-4 w-4 text-white" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 opacity-40 cursor-not-allowed">
                <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                  Next
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
