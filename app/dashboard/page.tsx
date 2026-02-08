import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { unsubscribeFromPlan, getAllCalendarDays, getPlanDays } from './actions'
import { SubscribeButton } from './subscribe-button'
import { ReadingProgress } from './reading-progress'
import { CalendarView } from './calendar-view'
import { ViewToggle } from './view-toggle'
import { LaunchPrayerPreview } from './launch-prayer-preview'
import type { CalendarDay, PlanDay } from './types'
import Link from 'next/link'
import { Target, TrendingUp, Users } from 'lucide-react'

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
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('plan_subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)

  if (subscriptionsError) {
    console.error('Failed to fetch user subscriptions:', subscriptionsError)
  }

  const { data: userProfile, error: userProfileError } = await supabase
    .from('user_profiles')
    .select('bible_year, accountability_group_id')
    .eq('user_id', user.id)
    .single()
  if (userProfileError) {
    console.error('Failed to fetch userprofile', userProfileError)
  }

  const subscribedPlanIds = subscriptions?.map(s => s.plan_id) || []

  // Get user's accountability group status

  let accountabilityStats = null
  if (userProfile?.accountability_group_id) {
    // Fetch group data
    const { data: group } = await supabase
      .from('accountability_groups')
      .select('name')
      .eq('id', userProfile.accountability_group_id)
      .single()

    // Count active commitments for the user
    const { count: activeCommitments } = await supabase
      .from('group_commitments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', userProfile.accountability_group_id)
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Count group members
    const { count: memberCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('accountability_group_id', userProfile.accountability_group_id)

    accountabilityStats = {
      groupName: group?.name,
      activeCommitments: activeCommitments || 0,
      memberCount: memberCount || 0,
    }
  }

  // 3. Fetch all reading plans
  const { data: allPlans } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: false })

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Building for the next 5, 50, and 500 years.</p>
        </header>

        {/* Show available plans if user has no subscription */}
        {subscribedPlanIds.length === 0 && (
          <div className="space-y-6">
            {/* Check if user expected auto-subscription but it failed */}
            {userProfile?.bible_year === true ? (
              // Edge case: Auto-subscription failed.
              <div>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                  <h3 className='text-lg font-semibold text-yellow-800 mb-2'>
                    Setup Issue Detected
                  </h3>
                  <p className='text-yellow-700'>
                    We couldn't automatically set up your Bible reading plan.
                    Please choose one below or contact support if this continues.
                  </p>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Available Reading Plans</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose a reading plan to resolve this issue</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Available Reading Plans</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose a reading plan to begin your journey</p>
              </div>
            )}

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

            {/* Accountability Widget */}
            {accountabilityStats ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Accountability</h3>
                  </div>
                  <Link
                    href="/accountability"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Group →
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Group</span>
                    <span className="font-medium text-gray-900">{accountabilityStats.groupName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Active Commitments
                    </span>
                    <span className="font-bold text-purple-600">{accountabilityStats.activeCommitments}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Members
                    </span>
                    <span className="font-medium text-gray-900">{accountabilityStats.memberCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Join an Accountability Group</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Stay on track with your goals by joining a group of like-minded believers who will support and challenge you.
                    </p>
                    <Link
                      href="/accountability"
                      className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            )}
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

            {/* Accountability Widget */}
            {accountabilityStats ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Accountability</h3>
                  </div>
                  <Link
                    href="/accountability"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Group →
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Group</span>
                    <span className="font-medium text-gray-900">{accountabilityStats.groupName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Active Commitments
                    </span>
                    <span className="font-bold text-purple-600">{accountabilityStats.activeCommitments}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Members
                    </span>
                    <span className="font-medium text-gray-900">{accountabilityStats.memberCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Join an Accountability Group</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Stay on track with your goals by joining a group of like-minded believers who will support and challenge you.
                    </p>
                    <Link
                      href="/accountability"
                      className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
