'use client'

import { useState } from 'react'
import { PlanStats } from './actions'
import { Users, BookOpen, TrendingUp, CheckCircle, Activity, Target, Eye } from 'lucide-react'
import { SubscribersModal } from './subscribers-modal'

type StatsCardsProps = {
  stats: PlanStats
}

export function PlanStatsCard({ stats }: StatsCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const completionPercentage = stats.total_subscribers > 0
    ? Math.round((stats.up_to_date_count / stats.total_subscribers) * 100)
    : 0

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{stats.title}</h3>
              {stats.description && (
                <p className="text-sm text-gray-600 mt-1">{stats.description}</p>
              )}
            </div>
            <div className="ml-4 flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition whitespace-nowrap flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View Progress
              </button>
              <a
                href={`/admin/plans/${stats.id}`}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
              >
                Manage
              </a>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Subscribers */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Subscribers</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_subscribers}</p>
            </div>

            {/* Total Days */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Total Days</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_days}</p>
            </div>

            {/* Active Readers */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Active (7d)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.active_readers}</p>
              {stats.total_subscribers > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round((stats.active_readers / stats.total_subscribers) * 100)}% of subscribers
                </p>
              )}
            </div>

            {/* Up to Date */}
            <div className="bg-teal-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-gray-700">Up to Date</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.up_to_date_count}</p>
              {stats.total_subscribers > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {completionPercentage}% of subscribers
                </p>
              )}
            </div>

            {/* Average Completion */}
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Avg Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.average_completion_rate}%</p>
            </div>

            {/* Completion Rate Visual */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">On Track</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completionPercentage}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscribersModal
        planId={stats.id}
        planTitle={stats.title}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

type OverallStatsProps = {
  totalUniqueSubscribers: number
  totalPlans: number
  recentCompletions: number
}

export function OverallStatsCards({ totalUniqueSubscribers, totalPlans, recentCompletions }: OverallStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8" />
          <span className="text-sm font-medium opacity-90">Total Members</span>
        </div>
        <p className="text-4xl font-bold">{totalUniqueSubscribers}</p>
        <p className="text-sm opacity-80 mt-1">Across all plans</p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8" />
          <span className="text-sm font-medium opacity-90">Active Plans</span>
        </div>
        <p className="text-4xl font-bold">{totalPlans}</p>
        <p className="text-sm opacity-80 mt-1">Reading plans available</p>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8" />
          <span className="text-sm font-medium opacity-90">Recent Activity</span>
        </div>
        <p className="text-4xl font-bold">{recentCompletions}</p>
        <p className="text-sm opacity-80 mt-1">Completions (last 7 days)</p>
      </div>
    </div>
  )
}
