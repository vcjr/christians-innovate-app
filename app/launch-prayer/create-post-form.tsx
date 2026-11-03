'use client'

import { useState, useRef } from 'react'
import { createPost } from './actions'
import { Rocket, Heart, Trophy, X, Loader2 } from 'lucide-react'

export function CreatePostForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'launch' | 'prayer' | 'win'>('prayer')
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createPost(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      formRef.current?.reset()
      setSelectedType('prayer')
      setError(null)
      setLoading(false)
      setIsOpen(false)
    }
  }

  const typeOptions = [
    { value: 'launch', label: 'Launch Alert', icon: Rocket, color: 'blue' },
    { value: 'prayer', label: 'Prayer Request', icon: Heart, color: 'red' },
    { value: 'win', label: 'Win/Praise', icon: Trophy, color: 'yellow' }
  ]

  const ctaOptions = [
    { value: 'launch', label: 'Post Launch Alert', icon: Rocket, className: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'prayer', label: 'Post Prayer Request', icon: Heart, className: 'bg-red-600 hover:bg-red-700' },
    { value: 'win', label: 'Share a Win', icon: Trophy, className: 'bg-yellow-500 hover:bg-yellow-600' }
  ] as const

  const submitLabel = ctaOptions.find((option) => option.value === selectedType)?.label ?? 'Post'

  const openForm = (type: 'launch' | 'prayer' | 'win') => {
    setSelectedType(type)
    setError(null)
    setIsOpen(true)
  }

  if (!isOpen) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ctaOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => openForm(option.value)}
              className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${option.className}`}
            >
              <Icon className="h-5 w-5" />
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Create Post</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value as 'launch' | 'prayer' | 'win')}
                  className={`p-3 rounded-lg border-2 transition-all ${isSelected
                    ? `border-${option.color}-500 bg-${option.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-1 ${isSelected ? `text-${option.color}-600` : 'text-gray-400'
                    }`} />
                  <p className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                    {option.label}
                  </p>
                </button>
              )
            })}
          </div>
          <input type="hidden" name="type" value={selectedType} />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              selectedType === 'launch' ? 'Launching my new feature!' :
                selectedType === 'prayer' ? 'Need prayer for...' :
                  'Celebrating a win!'
            }
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Share more details..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
