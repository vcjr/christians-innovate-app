'use client'

import { X, Mail, Clock, User, CheckCircle, XCircle } from 'lucide-react'
import type { EmailLog } from '@/utils/email/types'

interface EmailViewerModalProps {
  log: EmailLog | null
  onClose: () => void
}

export function EmailViewerModal({ log, onClose }: EmailViewerModalProps) {
  if (!log) return null

  const statusIcon = {
    sent: <CheckCircle className="w-5 h-5 text-green-600" />,
    failed: <XCircle className="w-5 h-5 text-red-600" />,
    pending: <Clock className="w-5 h-5 text-yellow-600" />,
  }

  const statusColor = {
    sent: 'text-green-700 bg-green-50',
    failed: 'text-red-700 bg-red-50',
    pending: 'text-yellow-700 bg-yellow-50',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Email Details</h2>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColor[log.status]}`}>
              {statusIcon[log.status]}
              {log.status.toUpperCase()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Email Metadata */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Recipient</div>
                  <div className="text-sm text-gray-900 font-mono">{log.recipient_email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Sent At</div>
                  <div className="text-sm text-gray-900">
                    {new Date(log.sent_at).toLocaleString()}
                  </div>
                </div>
              </div>
              {log.template_key && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Template</div>
                    <div className="text-sm text-gray-900 font-mono">{log.template_key}</div>
                  </div>
                </div>
              )}
              {log.resend_id && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Resend ID</div>
                    <div className="text-sm text-gray-900 font-mono truncate">{log.resend_id}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {log.error_message && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-900 mb-1">Error Message</div>
                <div className="text-sm text-red-700 font-mono">{log.error_message}</div>
              </div>
            )}

            {/* Subject */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Subject</div>
              <div className="text-base text-gray-900 font-medium">{log.subject}</div>
            </div>
          </div>

          {/* Email Preview Tabs */}
          {log.body_html && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                <p className="text-sm text-gray-500">This is how the email appeared to the recipient</p>
              </div>

              {/* HTML Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">HTML Version</span>
                </div>
                <div className="bg-white p-6">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: log.body_html }}
                  />
                </div>
              </div>

              {/* Plain Text Preview */}
              {log.body_text && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">Plain Text Version</span>
                  </div>
                  <div className="bg-white p-6">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {log.body_text}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {!log.body_html && (
            <div className="p-6 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Email content was not saved for this log entry.</p>
              <p className="text-sm mt-1">
                This may be an older email sent before content logging was enabled.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
