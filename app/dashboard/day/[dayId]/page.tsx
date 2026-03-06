import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { VerseDisplay } from '../../verse-display'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react'
import { CommentSection } from './comment-section'
import { MarkCompleteButton } from './mark-complete-button'
import { DayNavigation } from './day-navigation'
import Link from 'next/link'

export default async function DayViewPage({
  params,
}: {
  params: Promise<{ dayId: string }>
}) {
  const { dayId } = await params
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Fetch the day details
  const { data: day, error: dayError } = await supabase
    .from('plan_days')
    .select(`
      *,
      reading_plans(id, title, description),
      user_progress(is_completed)
    `)
    .eq('id', dayId)
    .single()

  if (dayError || !day) {
    return redirect('/dashboard')
  }

  // Check if user is subscribed to this plan
  const { data: subscription } = await supabase
    .from('plan_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', day.reading_plans?.id)
    .single()

  if (!subscription) {
    return redirect('/dashboard')
  }

  const isCompleted = day.user_progress?.[0]?.is_completed || false

  // Fetch sibling days and total count for navigation
  const planId = day.reading_plans?.id
  const [prevResult, nextResult, countResult] = await Promise.all([
    supabase
      .from('plan_days')
      .select('id, day_number')
      .eq('plan_id', planId)
      .lt('day_number', day.day_number)
      .order('day_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('plan_days')
      .select('id, day_number')
      .eq('plan_id', planId)
      .gt('day_number', day.day_number)
      .order('day_number', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('plan_days')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId),
  ])

  const prevDay = prevResult.data ?? null
  const nextDay = nextResult.data ?? null
  const totalDays = countResult.count ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <DayNavigation
        prevDay={prevDay}
        nextDay={nextDay}
        currentDayNumber={day.day_number}
        totalDays={totalDays}
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-6 sm:pt-8 pb-24 xl:pb-6">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">{day.reading_plans.title}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Day {day.day_number}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {isCompleted ? 'Completed' : 'Not Completed'}
              </span>
              <MarkCompleteButton dayId={dayId} isCompleted={isCompleted} />
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{day.scripture_reference}</span>
            </div>
            {day.date_assigned && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(day.date_assigned).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Devotional Content */}
        {day.content_markdown && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Devotional</h2>
            <div className="prose prose-sm sm:prose max-w-none">
              <ReactMarkdown>{day.content_markdown}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Bible Verse */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Scripture</h2>
          <VerseDisplay
            reference={day.scripture_reference}
            translation="KJV"
            showVersionSelector={true}
            showViewModeToggle={true}
            defaultViewMode="verse-by-verse"
            usePreferredTranslation={true}
          />
        </div>

        {/* Comments Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <CommentSection dayId={dayId} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
