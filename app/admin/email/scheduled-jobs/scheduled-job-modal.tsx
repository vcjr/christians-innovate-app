'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createScheduledJob, updateScheduledJob } from './actions'
import { ScheduledJob, COMMON_TIMEZONES, DAYS_OF_WEEK } from '@/utils/email/scheduled-jobs'
import { EmailTemplate } from '@/utils/email/types'

interface ScheduledJobModalProps {
  isOpen: boolean
  onClose: () => void
  job?: ScheduledJob | null
  templates: EmailTemplate[]
}

export default function ScheduledJobModal({
  isOpen,
  onClose,
  job,
  templates,
}: ScheduledJobModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Compute initial values from job or defaults
  const getInitialValues = () => ({
    name: job?.name || '',
    description: job?.description || '',
    templateKey: job?.template_key || '',
    scheduleType: (job?.schedule_type as 'daily' | 'weekly' | 'monthly') || 'daily',
    timezone: job?.timezone || 'America/New_York',
    hour: job?.hour || 8,
    minute: job?.minute || 0,
    dayOfWeek: job?.day_of_week || null,
    dayOfMonth: job?.day_of_month || null,
    recipientFilter: job?.recipient_filter || 'all',
    isActive: job?.is_active !== undefined ? job.is_active : true,
  })

  const [name, setName] = useState(getInitialValues().name)
  const [description, setDescription] = useState(getInitialValues().description)
  const [templateKey, setTemplateKey] = useState(getInitialValues().templateKey)
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>(getInitialValues().scheduleType)
  const [timezone, setTimezone] = useState(getInitialValues().timezone)
  const [hour, setHour] = useState(getInitialValues().hour)
  const [minute, setMinute] = useState(getInitialValues().minute)
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(getInitialValues().dayOfWeek)
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(getInitialValues().dayOfMonth)
  const [recipientFilter, setRecipientFilter] = useState(getInitialValues().recipientFilter)
  const [isActive, setIsActive] = useState(getInitialValues().isActive)

  // Reset form when modal opens/closes or job changes
  useEffect(() => {
    if (isOpen) {
      const values = getInitialValues()
      setName(values.name)
      setDescription(values.description)
      setTemplateKey(values.templateKey)
      setScheduleType(values.scheduleType)
      setTimezone(values.timezone)
      setHour(values.hour)
      setMinute(values.minute)
      setDayOfWeek(values.dayOfWeek)
      setDayOfMonth(values.dayOfMonth)
      setRecipientFilter(values.recipientFilter)
      setIsActive(values.isActive)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('template_key', templateKey)
    formData.append('schedule_type', scheduleType)
    formData.append('timezone', timezone)
    formData.append('hour', hour.toString())
    formData.append('minute', minute.toString())
    if (dayOfWeek !== null) formData.append('day_of_week', dayOfWeek.toString())
    if (dayOfMonth !== null) formData.append('day_of_month', dayOfMonth.toString())
    formData.append('recipient_filter', recipientFilter)
    formData.append('is_active', isActive.toString())

    const result = job
      ? await updateScheduledJob(job.id, formData)
      : await createScheduledJob(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {job ? 'Edit Scheduled Job' : 'Create Scheduled Job'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Daily Reading Reminders"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this scheduled job"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template *
              </label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.template_key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Filter *
              </label>
              <select
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Members</option>
                <option value="email_enabled">Email Notifications Enabled</option>
                <option value="ci_updates">CI Updates Subscribers</option>
                <option value="bible_year">Bible in a Year Subscribers</option>
                <option value="skill_share">Skill Share Subscribers</option>
              </select>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Type *
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone *
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hour (0-23) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minute (0-59) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {scheduleType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week *
                </label>
                <select
                  value={dayOfWeek ?? ''}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a day</option>
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scheduleType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Month (1-31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth ?? ''}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Job is active (will run on schedule)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
