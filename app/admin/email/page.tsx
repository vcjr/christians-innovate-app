import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, FileText, Send, List, Clock, Inbox, Users } from 'lucide-react'

export default async function EmailHomePage() {
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

  // Get quick stats
  const { count: templateCount } = await supabase
    .from('email_templates')
    .select('*', { count: 'exact', head: true })

  const { count: logCount } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })

  const { count: sentCount } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
        <p className="mt-2 text-gray-600">
          Manage email templates, send broadcasts, and view email logs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-gray-600">Email Templates</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{templateCount || 0}</div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-green-600" />
            <div className="text-sm text-green-600">Emails Sent</div>
          </div>
          <div className="text-3xl font-bold text-green-700">{sentCount || 0}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <List className="w-5 h-5 text-gray-600" />
            <div className="text-sm text-gray-600">Total Logs</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{logCount || 0}</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/email/templates"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
            Email Templates
          </h3>
          <p className="text-sm text-gray-600">
            Create and manage email templates with live HTML preview
          </p>
        </Link>

        <Link
          href="/admin/email/broadcast"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition">
            <Send className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition">
            Send Broadcast
          </h3>
          <p className="text-sm text-gray-600">
            Send emails to members using templates or custom content
          </p>
        </Link>

        <Link
          href="/admin/email/logs"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition">
            <List className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
            Email Logs
          </h3>
          <p className="text-sm text-gray-600">
            View and track all emails sent from the application
          </p>
        </Link>

        <Link
          href="/admin/email/scheduled-jobs"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4 group-hover:bg-orange-200 transition">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition">
            Scheduled Jobs
          </h3>
          <p className="text-sm text-gray-600">
            Manage automated email schedules with timezone control
          </p>
        </Link>

        <Link
          href="/admin/inbox"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4 group-hover:bg-indigo-200 transition">
            <Inbox className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
            Admin Inbox
          </h3>
          <p className="text-sm text-gray-600">
            Receive and send emails using various sender addresses
          </p>
        </Link>

        <Link
          href="/admin/email/mailing-list"
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg mb-4 group-hover:bg-teal-200 transition">
            <Users className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition">
            Mailing List
          </h3>
          <p className="text-sm text-gray-600">
            Manage external contacts and sync the full mailing list to Resend
          </p>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Automated Emails</h3>
          <p className="text-sm text-blue-800 mb-4">
            Manage automated email schedules in the Scheduled Jobs section. Default jobs:
          </p>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <strong>Daily Reading Reminders</strong>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <strong>Meeting Reminders</strong>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <strong>Weekly Digest</strong>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <strong>Welcome Emails</strong> (instant on signup)
            </li>
          </ul>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3">Admin Inbox</h3>
          <p className="text-sm text-indigo-800 mb-4">
            Send emails using various sender addresses or custom prefixes:
          </p>
          <ul className="space-y-2 text-sm text-indigo-900 mb-4">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <strong>noreply@</strong> - Automated notifications
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <strong>support@</strong> - User support
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <strong>tech@</strong> - Technical issues
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <strong>community@</strong> - Community updates
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <strong>Custom prefix</strong> - Use yourname@ with your display name
            </li>
          </ul>
          <div className="pt-3 border-t border-indigo-300">
            <p className="text-xs text-indigo-700">
              <strong>📥 Receive emails:</strong> Configure webhook in Resend for{' '}
              <code className="bg-indigo-100 px-1 rounded">/api/webhooks/resend-inbound</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
