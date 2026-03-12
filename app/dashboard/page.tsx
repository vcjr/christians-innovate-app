import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { unsubscribeFromPlan } from './actions'
import { getAllCalendarDays, getPlanDays } from './actions'
import { SubscribeButton } from './subscribe-button'
import { ReadingProgress } from './reading-progress'
import { CalendarView } from './calendar-view'
import { ViewToggle } from './view-toggle'
import { LaunchPrayerPreview } from './launch-prayer-preview'
import type { CalendarDay, PlanDay } from './types'

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  const view = resolvedParams.view === 'list' ? 'list' : 'calendar'

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // 2. Get user's subscriptions
  const { data: subscriptions } = await supabase
    .from('plan_subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)

  const subscribedPlanIds = subscriptions?.map(s => s.plan_id) || []

  // 3. If not subscribed, fetch all reading plans to show
  let allPlans = null
  if (subscribedPlanIds.length === 0) {
    const { data } = await supabase
      .from('reading_plans')
      .select('*')
      .order('created_at', { ascending: false })
    allPlans = data
  }

  // 4. If subscribed, fetch plan details + view-specific data
  let currentPlan = null
  let calendarData: { days: CalendarDay[] } = { days: [] }
  let listData: { days: PlanDay[]; hasMore: boolean } = { days: [], hasMore: false }

  if (subscribedPlanIds.length > 0) {
    const activePlanId = subscribedPlanIds[0]

    const { data: plan } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('id', activePlanId)
      .single()

    currentPlan = plan

    if (view === 'calendar') {
      const calendarResult = await getAllCalendarDays(activePlanId)
      if (calendarResult.error) {
        throw new Error(calendarResult.error)
      }
      calendarData = { days: calendarResult.days }
    } else {
      const listResult = await getPlanDays(activePlanId, 0, 10)
      listData = { days: listResult.days, hasMore: listResult.hasMore }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-6 sm:pt-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Building for the next 5, 50, and 500 years.</p>
        </header>

        {/* Show available plans if user has no subscription */}
        {subscribedPlanIds.length === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Available Reading Plans</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose a reading plan to begin your journey</p>
            </div>

            {allPlans && allPlans.length > 0 ? (
              <div className="space-y-4">
                {allPlans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{plan.title}</h3>
                        {plan.description && (
                          <p className="text-sm sm:text-base text-gray-600 mb-4">{plan.description}</p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-500">
                          Created {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <SubscribeButton planId={plan.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-gray-600">No reading plans available yet. Check back soon!</p>
              </div>
            )}

            {/* Launch & Prayer Preview */}
            <LaunchPrayerPreview />
          </div>
        )}

        {/* Show current plan if subscribed */}
        {subscribedPlanIds.length > 0 && currentPlan && (
          <div className="space-y-6">
            {/* Plan header */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{currentPlan.title}</h2>
                  {currentPlan.description && (
                    <p className="text-sm sm:text-base text-gray-600">{currentPlan.description}</p>
                  )}
                </div>
                <form action={async () => {
                  'use server'
                  await unsubscribeFromPlan(currentPlan.id)
                }}>
                  <button className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium whitespace-nowrap">
                    Unsubscribe
                  </button>
                </form>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 hidden sm:block">Reading Plan</h3>
              <ViewToggle currentView={view} />
            </div>

            {/* Calendar view */}
            {view === 'calendar' && (
              <CalendarView
                allDays={calendarData.days}
              />
            )}

            {/* List view with infinite scroll */}
            {view === 'list' && (
              <ReadingProgress
                initialDays={listData.days}
                planId={currentPlan.id}
                hasMore={listData.hasMore}
              />
            )}

            {/* Launch & Prayer Preview */}
            <LaunchPrayerPreview />
          </div>
        )}
      </div>
    </div>
  )
}
