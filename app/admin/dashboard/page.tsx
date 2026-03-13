import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanStatistics, getOverallStats } from './actions'
import { PlanStatsCard, OverallStatsCards } from './stats-cards'
import { BarChart3, RefreshCw, BookOpen } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    redirect('/dashboard')
  }

  // Fetch plan statistics
  const planStatsResult = await getPlanStatistics()
  const overallStats = await getOverallStats()

  if (planStatsResult.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading statistics: {planStatsResult.error}
      </div>
    )
  }

  const planStats = planStatsResult.data || []

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Reading Plans Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Monitor subscriber engagement and reading progress
          </p>
        </div>
        <form>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </form>
      </div>

      {/* Overall Stats */}
      <OverallStatsCards
        totalUniqueSubscribers={overallStats.totalUniqueSubscribers ?? 0}
        totalPlans={overallStats.totalPlans ?? 0}
        recentCompletions={overallStats.recentCompletions ?? 0}
      />

      {/* Individual Plan Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">Plan Statistics</h2>
        </div>

        {planStats.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reading plans yet</h3>
            <p className="text-gray-600 mb-4">Create your first reading plan to start tracking engagement.</p>
            <a
              href="/admin/plans"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Reading Plan
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {planStats.map((stats) => (
              <PlanStatsCard key={stats.id} stats={stats} />
            ))}
          </div>
        )}
      </div>

      {/* Legend / Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Understanding the Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">📊 Subscribers</p>
            <p className="text-gray-700">Total number of users subscribed to this plan</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">📖 Total Days</p>
            <p className="text-gray-700">Number of daily readings in this plan</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">🔥 Active (7d)</p>
            <p className="text-gray-700">Users who completed at least one day in the last week</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">✅ Up to Date</p>
            <p className="text-gray-700">Users who have completed ≥80% of available days</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">🎯 Avg Progress</p>
            <p className="text-gray-700">Average completion percentage across all subscribers</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">📈 On Track</p>
            <p className="text-gray-700">Percentage of subscribers who are up to date</p>
          </div>
        </div>
      </div>
    </div>
  )
}
