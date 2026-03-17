'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react'
import type { CalendarDay } from './types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarViewProps {
  allDays: CalendarDay[]
}

/**
 * Find today's date if it falls within the plan range,
 * otherwise default to the first day in the plan.
 */
function getInitialMonth(allDays: CalendarDay[]): { year: number; month: number } {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const months = new Set<string>()
  let firstDate: string | null = null
  for (const d of allDays) {
    const dt = d.date_assigned
    if (dt) {
      if (!firstDate || dt < firstDate) firstDate = dt
      months.add(dt.substring(0, 7))
    }
  }

  const todayMonth = todayStr.substring(0, 7)
  if (months.has(todayMonth)) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }

  if (firstDate) {
    const [y, m] = firstDate.split('-').map(Number)
    return { year: y, month: m }
  }

  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function CalendarView({ allDays }: CalendarViewProps) {
  const initial = getInitialMonth(allDays)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Pre-compute a full date->day lookup once from allDays
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    for (const d of allDays) {
      if (d.date_assigned) {
        map.set(d.date_assigned, d)
      }
    }
    return map
  }, [allDays])

  // Lookup by id for the selected detail bar
  const dayById = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    for (const d of allDays) map.set(d.id, d)
    return map
  }, [allDays])

  const selectedDay = selectedId ? dayById.get(selectedId) ?? null : null

  const goToPrevMonth = () => {
    setSelectedId(null)
    setMonth((m) => {
      if (m === 1) { setYear((y) => y - 1); return 12 }
      return m - 1
    })
  }

  const goToNextMonth = () => {
    setSelectedId(null)
    setMonth((m) => {
      if (m === 12) { setYear((y) => y + 1); return 1 }
      return m + 1
    })
  }

  // Calendar grid layout
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  type Cell = { date: number; dateStr: string } | null
  const cells: Cell[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      return { date: d, dateStr }
    }),
  ]

  const monthReadingsCount = cells.filter((c) => c && dayMap.has(c.dateStr)).length

  const handleCellClick = (planDay: CalendarDay | undefined) => {
    if (!planDay) return
    setSelectedId((prev) => (prev === planDay.id ? null : planDay.id))
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Month navigation header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900">
              {MONTH_NAMES[month - 1]} {year}
            </h3>
            {monthReadingsCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{monthReadingsCount} reading{monthReadingsCount !== 1 ? 's' : ''} this month</p>
            )}
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday column headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-16 sm:h-[72px] border-r border-b border-gray-50 bg-gray-50/30"
                />
              )
            }

            const planDay = dayMap.get(cell.dateStr)
            const isToday = cell.dateStr === todayStr
            const isCompleted = planDay?.user_progress?.[0]?.is_completed === true
            const isPast = cell.dateStr < todayStr
            const isSelected = planDay?.id === selectedId

            if (planDay) {
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleCellClick(planDay)}
                  aria-label={`${MONTH_NAMES[month - 1]} ${cell.date}: Day ${planDay.day_number}, ${planDay.scripture_reference}${isCompleted ? ', completed' : ''}`}
                  aria-pressed={isSelected}
                  className={[
                    'relative h-16 sm:h-[72px] border-r border-b border-gray-100 flex flex-col items-center justify-start pt-1.5 px-0.5 transition-colors',
                    'cursor-pointer hover:bg-blue-50/50 active:bg-blue-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                    isToday && !isSelected ? 'bg-blue-50/60' : '',
                    isSelected ? 'bg-blue-100 ring-2 ring-inset ring-blue-500' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Day number */}
                  <span
                    className={[
                      'text-xs sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full leading-none',
                      isToday
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-700',
                    ].join(' ')}
                  >
                    {cell.date}
                  </span>

                  {/* Plan day indicator */}
                  <div className="mt-0.5 flex flex-col items-center gap-0.5 w-full px-1">
                    <div
                      className={[
                        'w-full max-w-[40px] h-1 rounded-full',
                        isCompleted ? 'bg-green-500' : 'bg-blue-400',
                      ].join(' ')}
                    />
                    <span className="text-[8px] sm:text-[9px] leading-none text-gray-400">
                      Day {planDay.day_number}
                    </span>
                  </div>
                </button>
              )
            }

            return (
              <div
                key={cell.dateStr}
                className={[
                  'relative h-16 sm:h-[72px] border-r border-b border-gray-100 flex flex-col items-center justify-start pt-1.5 px-0.5',
                  isToday ? 'bg-blue-50/60' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Day number */}
                <span
                  className={[
                    'text-xs sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full leading-none',
                    isToday
                      ? 'bg-blue-600 text-white font-semibold'
                      : isPast
                        ? 'text-gray-300'
                        : 'text-gray-700',
                  ].join(' ')}
                >
                  {cell.date}
                </span>
              </div>
            )
          })}
        </div>

        {/* Selected day detail bar */}
        {selectedDay && (
          <div className="border-t border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3 transition-all duration-150">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-900">Day {selectedDay.day_number}</span>
                {selectedDay.user_progress?.[0]?.is_completed && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">{selectedDay.scripture_reference}</p>
            </div>
            <Link
              href={`/dashboard/day/${selectedDay.id}`}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex-shrink-0"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Go to reading</span>
              <span className="sm:hidden">Read</span>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {monthReadingsCount === 0 && (
          <div className="px-6 py-8 text-center border-t border-gray-100">
            <p className="text-sm text-gray-400">
              No readings for {MONTH_NAMES[month - 1]}. Try navigating to another month.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-1 rounded-full bg-green-500" />
            Completed
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-1 rounded-full bg-blue-400" />
            Not yet read
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div
              className="w-5 h-5 rounded-full bg-blue-600"
              aria-hidden="true"
            />
            Today
          </div>
          <div className="ml-auto text-xs text-gray-400">Tap a day to see details</div>
        </div>
      </div>
    </>
  )
}
