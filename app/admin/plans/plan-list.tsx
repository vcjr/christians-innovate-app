'use client'

import { deletePlan, setDefaultPlan } from './actions'
import { useState } from 'react'
import { Trash2, Calendar, FileText, Star } from 'lucide-react'

type Plan = {
  id: string
  title: string
  description: string | null
  is_default: boolean
  created_at: string
}

export function PlanList({ plans }: { plans: Plan[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  async function handleDelete(planId: string, planTitle: string) {
    if (!confirm(`Are you sure you want to delete "${planTitle}"? This will also delete all associated daily readings.`)) {
      return
    }

    setDeletingId(planId)
    const result = await deletePlan(planId)

    if (result?.error) {
      alert('Error deleting plan: ' + result.error)
    }

    setDeletingId(null)
  }

  async function handleSetDefault(planId: string, planTitle: string) {
    if (!confirm(`Set "${planTitle}" as the default plan? All new members will be auto-subscribed to it.`)) {
      return
    }

    setSettingDefaultId(planId)
    const result = await setDefaultPlan(planId)

    if (result?.error) {
      alert('Error setting default: ' + result.error)
    }

    setSettingDefaultId(null)
  }

  if (plans.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reading plans yet</h3>
        <p className="text-gray-600">Create your first reading plan to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Reading Plans</h3>
        <p className="text-xs text-gray-500 mt-0.5">The default plan is automatically assigned to every new member at signup.</p>
      </div>

      <div className="divide-y divide-gray-200">
        {plans.map((plan) => (
          <div key={plan.id} className={`px-4 sm:px-6 py-4 hover:bg-gray-50 transition ${plan.is_default ? 'bg-amber-50 hover:bg-amber-50' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={`/admin/plans/${plan.id}`}
                  className="block group"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {plan.title}
                    </h4>
                    {plan.is_default && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Default
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{plan.description}</p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                </a>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!plan.is_default && (
                  <button
                    onClick={() => handleSetDefault(plan.id, plan.title)}
                    disabled={settingDefaultId === plan.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 disabled:opacity-50 transition"
                  >
                    <Star className="h-4 w-4" />
                    {settingDefaultId === plan.id ? 'Setting…' : 'Set Default'}
                  </button>
                )}

                <a
                  href={`/admin/plans/${plan.id}`}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Days</span>
                  <span className="sm:hidden">Days</span>
                </a>

                <button
                  onClick={() => handleDelete(plan.id, plan.title)}
                  disabled={deletingId === plan.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === plan.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
