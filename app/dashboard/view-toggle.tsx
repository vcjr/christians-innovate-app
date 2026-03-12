'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Calendar, LayoutList } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'calendar' | 'list'
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()

  const setView = (view: 'calendar' | 'list') => {
    router.push(view === 'calendar' ? pathname : `${pathname}?view=list`)
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => setView('calendar')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          currentView === 'calendar'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
        ].join(' ')}
        aria-pressed={currentView === 'calendar'}
      >
        <Calendar className="h-4 w-4" />
        Calendar
      </button>
      <button
        onClick={() => setView('list')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          currentView === 'list'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
        ].join(' ')}
        aria-pressed={currentView === 'list'}
      >
        <LayoutList className="h-4 w-4" />
        List
      </button>
    </div>
  )
}
