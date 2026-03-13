'use client'

import { useEffect, useState } from 'react'
import { X, Users, Calendar, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { getPlanSubscribers, SubscriberProgress } from './actions'

type SubscribersModalProps = {
  planId: string
  planTitle: string
  isOpen: boolean
  onClose: () => void
}

export function SubscribersModal({ planId, planTitle, isOpen, onClose }: SubscribersModalProps) {
  const [subscribers, setSubscribers] = useState<SubscriberProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadSubscribers()
    }
  }, [isOpen, planId])

  const loadSubscribers = async () => {
    setLoading(true)
    setError(null)
    const result = await getPlanSubscribers(planId)
    if (result.error) {
      setError(result.error)
    } else {
      setSubscribers(result.data || [])
    }
    setLoading(false)
  }

  if (!isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{planTitle}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error loading subscribers: {error}
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers yet</h3>
              <p className="text-gray-600">This plan doesn't have any subscribers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.user_id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {subscriber.avatar_url ? (
                        <img
                          src={subscriber.avatar_url}
                          alt={subscriber.full_name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(subscriber.full_name)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {subscriber.full_name}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Progress */}
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-gray-700">
                            {subscriber.completed_days} of {subscriber.total_days} days
                          </span>
                          <span className="font-semibold text-blue-600">
                            ({subscriber.completion_percentage}%)
                          </span>
                        </div>

                        {/* Current Day */}
                        {subscriber.current_day && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="text-gray-700">
                              Current: Day {subscriber.current_day}
                            </span>
                          </div>
                        )}

                        {/* Last Activity */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">
                            Last active: {formatDate(subscriber.last_activity)}
                          </span>
                        </div>

                        {/* Subscribed Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <span className="text-gray-700">
                            Joined: {formatDate(subscriber.subscribed_at)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${subscriber.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
