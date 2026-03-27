'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Eye, Filter, Mail } from 'lucide-react'
import type { EmailLog } from '@/utils/email/types'
import { EmailViewerModal } from './email-viewer-modal'

interface EmailLogsListProps {
  logs: EmailLog[]
}

export function EmailLogsList({ logs: initialLogs }: EmailLogsListProps) {
  const [logs] = useState(initialLogs)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [templateFilter, setTemplateFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  // Get unique template keys for filtering
  const templateKeys = [...new Set(logs.map((log) => log.template_key).filter(Boolean))]

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false
    if (templateFilter !== 'all' && log.template_key !== templateFilter) return false
    return true
  })

  // Stats
  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === 'sent').length,
    failed: logs.filter((l) => l.status === 'failed').length,
    pending: logs.filter((l) => l.status === 'pending').length,
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Mail className="w-5 h-5 text-gray-600" />
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Emails</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Sent</div>
          <div className="text-2xl font-bold text-green-700">{stats.sent}</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Templates</option>
              {templateKeys.map((key) => (
                <option key={key} value={key || ''}>
                  {key || 'No Template'}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'all' || templateFilter !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setTemplateFilter('all')
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No email logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Sent At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.recipient_email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3">
                      {log.template_key ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded">
                          {log.template_key}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(log.sent_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Viewer Modal */}
      <EmailViewerModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}
