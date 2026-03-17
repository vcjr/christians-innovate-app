'use client'

import { deletePlan, setDefaultPlan } from './actions'
import { useState } from 'react'
import { Trash2, Calendar, FileText, Star } from 'lucide-react'

type Plan = {
  id: string
  title: string
  description: string | null
  created_at: string
  is_default: boolean
}

export function PlanList({ plans }: { plans: Plan[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingID, setUpdatingID] = useState<string | null>(null)

  async function handleSetDefault(planId: string) {
    setUpdatingID(planId)
    const result = await setDefaultPlan(planId)

    if (result?.error) {
      alert('Error setting default plan: ' + result.error)
    }

    setUpdatingID(null)
  }

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
      </div>

      <div className="divide-y divide-gray-200">
        {plans.map((plan) => (
          <div key={plan.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className='flex items-center gap-2'>
                  <button
                    onClick={ () => handleSetDefault(plan.id)}
                    disabled={updatingID === plan.id}
                    className={`transition-colors p-1 rounded-full hover:bg-gray-200 ${
                      plan.is_default ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                    title={plan.is_default ? "This is the default plan" : "Make default"}
                  >
                    <Star className={`h-5 w-5 ${plan.is_default ? 'fill-current' : ''}`} />
                  </button>
                <a
                  href={`/admin/plans/${plan.id}`}
                  className="block group"
                >
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {plan.title}
                  </h4>
                </a>  
                </div>

                  {plan.description && (
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{plan.description}</p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                
              </div>

              <div className="flex items-center gap-2">
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
