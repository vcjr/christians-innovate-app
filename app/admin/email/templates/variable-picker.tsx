'use client'

import { useState } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'

interface VariablePickerProps {
  onInsert: (variable: string) => void
}

const AVAILABLE_VARIABLES = [
  {
    category: 'User',
    variables: [
      { key: '{{user.name}}', description: 'User full name' },
      { key: '{{user.email}}', description: 'User email address' },
      { key: '{{user.id}}', description: 'User ID' },
    ],
  },
  {
    category: 'Reading Day',
    variables: [
      { key: '{{day.number}}', description: 'Day number in plan' },
      { key: '{{day.scripture}}', description: 'Scripture reference' },
      { key: '{{day.title}}', description: 'Reading plan title' },
      { key: '{{day.link}}', description: 'Link to day page' },
    ],
  },
  {
    category: 'Meeting',
    variables: [
      { key: '{{meeting.title}}', description: 'Meeting title' },
      { key: '{{meeting.description}}', description: 'Meeting description' },
      { key: '{{meeting.date}}', description: 'Meeting date' },
      { key: '{{meeting.time}}', description: 'Meeting time' },
      { key: '{{meeting.zoom_link}}', description: 'Zoom link' },
    ],
  },
  {
    category: 'Weekly Digest',
    variables: [
      { key: '{{digest.launches}}', description: 'Number of launches' },
      { key: '{{digest.prayers}}', description: 'Number of prayer requests' },
      { key: '{{digest.wins}}', description: 'Number of wins' },
    ],
  },
  {
    category: 'System',
    variables: [
      { key: '{{unsubscribe_link}}', description: 'Unsubscribe URL' },
      { key: '{{site_url}}', description: 'Base site URL' },
    ],
  },
]

export function VariablePicker({ onInsert }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setCopiedVariable(variable)
    setTimeout(() => setCopiedVariable(null), 2000)
  }

  const handleInsert = (variable: string) => {
    onInsert(variable)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
      >
        Insert Variable
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            {AVAILABLE_VARIABLES.map((category) => (
              <div key={category.category} className="border-b border-gray-200 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-900">
                  {category.category}
                </div>
                <div className="divide-y divide-gray-100">
                  {category.variables.map((variable) => (
                    <div
                      key={variable.key}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-mono text-sm text-blue-600 truncate"
                            onClick={() => handleInsert(variable.key)}
                          >
                            {variable.key}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {variable.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(variable.key)
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy variable"
                        >
                          {copiedVariable === variable.key ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
