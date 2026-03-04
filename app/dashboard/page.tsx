import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { unsubscribeFromPlan } from './actions'
import { SubscribeButton } from './subscribe-button'
import { ReadingProgress } from './reading-progress'
import { LaunchPrayerPreview } from './launch-prayer-preview'

export default async function Dashboard() {
  const supabase = await createClient()

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

  let subscribedPlanIds = subscriptions?.map(s => s.plan_id) || []

  // 3. If no subscription, auto-subscribe to the default plan (existing members)
  if (subscribedPlanIds.length === 0) {
    const { data: defaultPlan } = await supabase
      .from('reading_plans')
      .select('id')
      .eq('is_default', true)
      .single()

    if (defaultPlan) {
      await supabase
        .from('plan_subscriptions')
        .insert({ user_id: user.id, plan_id: defaultPlan.id })
        .select()
      subscribedPlanIds = [defaultPlan.id]
    }
  }

  // 4. Fetch all reading plans (used when no plan at all is available)
  const { data: allPlans } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: false })

  // 5. If user has subscriptions, fetch their plan days with progress
  let planDays = null
  let currentPlan = null

  if (subscribedPlanIds.length > 0) {
    // Show the first subscribed plan (prioritise the default if multiple)
    const activePlanId = subscribedPlanIds[0]

    const { data: plan } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('id', activePlanId)
      .single()

    currentPlan = plan

    const { data: days } = await supabase
      .from('plan_days')
      .select(`
        *,
        user_progress(is_completed)
      `)
      .eq('plan_id', activePlanId)
      .order('day_number', { ascending: true })

    planDays = days
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-6 sm:pt-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Building for the next 5, 50, and 500 years.</p>
        </header>

        {/* Show available plans if no default plan has been set yet */}
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

        {/* Show current plan and daily readings if subscribed */}
        {subscribedPlanIds.length > 0 && currentPlan && (
          <div className="space-y-6">
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

            <ReadingProgress days={planDays || []} />

            {/* Launch & Prayer Preview */}
            <LaunchPrayerPreview />
          </div>
        )}
      </div>
    </div>
  )
}
