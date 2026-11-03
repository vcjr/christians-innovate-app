'use client'

import { useRouter } from 'next/navigation'
import { VerseDisplay } from './verse-display'
import { toggleProgress } from './actions'

interface DayCardProps {
  day: {
    id: string
    day_number: number
    scripture_reference: string
    content_markdown: string | null
  }
  isCompleted: boolean
}

export function DayCard({ day, isCompleted }: DayCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/dashboard/day/${day.id}`)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const formData = new FormData(e.currentTarget)
    await toggleProgress(formData)
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900">
            Day {day.day_number}: {day.scripture_reference}
          </h3>
          {day.content_markdown && (
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">
              {day.content_markdown}
            </p>
          )}
        </div>

        <form
          onSubmit={handleFormSubmit}
          onClick={(e) => e.stopPropagation()}
        >
          <input type="hidden" name="day_id" value={day.id} />
          <input type="hidden" name="current_status" value={String(isCompleted)} />
          <button
            type="submit"
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${isCompleted
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {isCompleted ? 'Completed' : 'Mark as Read'}
          </button>
        </form>
      </div>

      {/* Display truncated Bible verse */}
      <div className="border-t border-gray-200">
        <VerseDisplay
          reference={day.scripture_reference}
          truncate={true}
          maxLength={120}
          usePreferredTranslation={true}
        />
      </div>
    </div>
  )
}
