'use client'

import { createGroup } from '../actions'
import { useState } from 'react'

export function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)
    
    try {
      const result = await createGroup(formData)

      // Handle validation/auth errors returned as an object instead of thrown
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        setError(result.error as string)
      }

      // If there was no redirect/throw, ensure submitting state is reset
      setIsSubmitting(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to create group')
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Group Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          disabled={isSubmitting}
          placeholder="e.g., Morning Warriors, Business Builders"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="target_objective" className="block text-sm font-medium text-gray-700 mb-2">
          Target Objective *
        </label>
        <textarea
          id="target_objective"
          name="target_objective"
          required
          disabled={isSubmitting}
          rows={4}
          placeholder="What is your group working towards? (e.g., Launch our businesses by Q3, Build consistent spiritual habits, Complete certification programs)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
        />
        <p className="text-sm text-gray-500 mt-1">This shared goal will guide your group's commitments and check-ins</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Group Guidelines</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• You can belong to multiple accountability groups at once</li>
          <li>• As the creator, you can invite members from the directory</li>
          <li>• All members can add commitments and schedule meetings</li>
          <li>• You can leave the group at any time</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </button>
        <a
          href="/accountability"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
