'use client'

import { useState } from 'react'
import { Calendar, Clock, PlayCircle, PauseCircle, Edit, Trash2 } from 'lucide-react'
import { ScheduledJob, formatNextRun, formatLastRun, DAYS_OF_WEEK } from '@/utils/email/scheduled-jobs'
import { deleteScheduledJob, toggleJobStatus } from './actions'
import ScheduledJobModal from './scheduled-job-modal'
import { EmailTemplate } from '@/utils/email/types'

interface ScheduledJobsListProps {
  jobs: ScheduledJob[]
  templates: EmailTemplate[]
}

export default function ScheduledJobsList({ jobs, templates }: ScheduledJobsListProps) {
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleEdit = (job: ScheduledJob) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedJob(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled job?')) return

    setDeletingId(id)
    const result = await deleteScheduledJob(id)
    if (result.error) {
      alert(result.error)
    }
    setDeletingId(null)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await toggleJobStatus(id, !currentStatus)
    if (result.error) {
      alert(result.error)
    }
    setTogglingId(null)
  }

  const getScheduleDescription = (job: ScheduledJob) => {
    const time = `${job.hour?.toString().padStart(2, '0')}:${job.minute?.toString().padStart(2, '0')}`

    if (job.schedule_type === 'daily') {
      return `Daily at ${time}`
    } else if (job.schedule_type === 'weekly') {
      const day = DAYS_OF_WEEK.find((d) => d.value === job.day_of_week)?.label || 'Unknown'
      return `Weekly on ${day}s at ${time}`
    } else if (job.schedule_type === 'monthly') {
      return `Monthly on day ${job.day_of_month} at ${time}`
    }
    return 'Custom schedule'
  }

  const getTemplateName = (templateKey: string | null) => {
    if (!templateKey) return 'No template'
    const template = templates.find((t) => t.template_key === templateKey)
    return template?.name || templateKey
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Scheduled Jobs ({jobs.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage automated email schedules with custom timezones
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No scheduled jobs yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first scheduled email job to automate communications
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Scheduled Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {job.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${job.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {job.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  {job.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {job.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Schedule</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {getScheduleDescription(job)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 mb-1">Timezone</div>
                      <div className="font-medium text-gray-900">
                        {job.timezone}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 mb-1">Template</div>
                      <div className="font-medium text-gray-900">
                        {getTemplateName(job.template_key)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 mb-1">Recipients</div>
                      <div className="font-medium text-gray-900">
                        {job.recipient_filter.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Next Run</div>
                      <div className="font-medium text-blue-600">
                        {formatNextRun(job.next_run_at, job.timezone)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 mb-1">Last Run</div>
                      <div className="font-medium text-gray-900">
                        {formatLastRun(job.last_run_at, job.timezone)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(job.id, job.is_active)}
                    disabled={togglingId === job.id}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title={job.is_active ? 'Pause job' : 'Activate job'}
                  >
                    {job.is_active ? (
                      <PauseCircle className="w-5 h-5" />
                    ) : (
                      <PlayCircle className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleEdit(job)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Edit job"
                  >
                    <Edit className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduledJobModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedJob(null)
        }}
        job={selectedJob}
        templates={templates}
      />
    </>
  )
}
