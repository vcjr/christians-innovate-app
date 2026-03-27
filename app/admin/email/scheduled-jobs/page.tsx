import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getScheduledJobs } from './actions'
import { getTemplates } from '../templates/actions'
import ScheduledJobsList from './scheduled-jobs-list'

export default async function ScheduledJobsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    redirect('/dashboard')
  }

  const jobsResult = await getScheduledJobs()
  const templatesResult = await getTemplates()

  if (jobsResult.error || templatesResult.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
          Error loading data: {jobsResult.error || templatesResult.error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Email Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Scheduled Jobs
        </h1>
        <p className="text-gray-600">
          Manage automated email schedules with timezone control and custom templates
        </p>
      </div>

      <ScheduledJobsList
        jobs={jobsResult.jobs || []}
        templates={templatesResult.templates || []}
      />
    </div>
  )
}
