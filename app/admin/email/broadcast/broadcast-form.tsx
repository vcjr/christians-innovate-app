'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Send, Users, Mail, FlaskConical } from 'lucide-react'
import type { EmailTemplate } from '@/utils/email/types'
import type { SenderAddress } from '@/utils/email/scheduled-jobs'
import { sendBroadcast, getRecipientCount, sendTestEmail } from './actions'
import { EmailEditor } from '../templates/email-editor'
import { VariablePicker } from '../templates/variable-picker'

interface BroadcastFormProps {
  templates: EmailTemplate[]
  senderAddresses: SenderAddress[]
}

function SubmitButton({ recipientCount }: { recipientCount: number }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || recipientCount === 0}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-medium"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="w-5 h-5" />
          Send to {recipientCount} {recipientCount === 1 ? 'Member' : 'Members'}
        </>
      )}
    </button>
  )
}

export function BroadcastForm({ templates, senderAddresses }: BroadcastFormProps) {
  const defaultFrom =
    senderAddresses.find((s) => s.purpose === 'noreply')?.email_address ||
    senderAddresses[0]?.email_address ||
    'noreply@christiansinnovate.com'
  const [selectedFrom, setSelectedFrom] = useState(defaultFrom)
  const [recipientFilter, setRecipientFilter] = useState('email_enabled')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('<p>Hello {{user.name}},</p><p></p>')
  const [recipientCount, setRecipientCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    sent: number
    failed: number
    total: number
    warning?: string
  } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)

  // Fetch recipient count when filter changes
  useEffect(() => {
    async function fetchCount() {
      const result = await getRecipientCount(recipientFilter)
      if (result.count !== undefined) {
        setRecipientCount(result.count)
      }
    }
    fetchCount()
  }, [recipientFilter])

  async function handleTestSend() {
    setTestResult(null)
    setTestSending(true)
    const fd = new FormData()
    fd.set('test_email', testEmail)
    fd.set('template_id', selectedTemplate)
    fd.set('from_email', selectedFrom)
    if (customSubject) fd.set('custom_subject', customSubject)
    if (selectedTemplate === 'custom') fd.set('custom_body', customBody)
    const result = await sendTestEmail(fd)
    setTestResult(result ?? { error: 'Unknown error' })
    setTestSending(false)
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)

    // Add custom body to form data if using custom template
    if (selectedTemplate === 'custom') {
      formData.set('custom_body', customBody)
    }

    const result = await sendBroadcast(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result && 'success' in result && result.success) {
      setSuccess({
        sent: result.sent || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        warning: result.warning,
      })
    }
  }

  const selectedTemplateData = templates.find(
    (t) => t.template_key === selectedTemplate
  )

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-900 font-semibold mb-2">
            ✓ Broadcast sent successfully!
          </div>
          <div className="text-green-800 text-sm">
            Sent: {success.sent} | Failed: {success.failed} | Total:{' '}
            {success.total}
          </div>
          {success.warning && (
            <div className="text-amber-700 text-sm mt-2 border-t border-green-200 pt-2">
              ⚠ {success.warning}
            </div>
          )}
        </div>
      )}

      {/* Recipient Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <input
              type="radio"
              name="recipient_filter"
              value="all"
              checked={recipientFilter === 'all'}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">All Members</div>
              <div className="text-sm text-gray-600">
                Send to every member in the community
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <input
              type="radio"
              name="recipient_filter"
              value="email_enabled"
              checked={recipientFilter === 'email_enabled'}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Email Notifications Enabled (Recommended)
              </div>
              <div className="text-sm text-gray-600">
                Only send to members who have email notifications enabled
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <input
              type="radio"
              name="recipient_filter"
              value="ci_updates"
              checked={recipientFilter === 'ci_updates'}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                CI Updates Subscribers
              </div>
              <div className="text-sm text-gray-600">
                Members who opted in for Christians Innovate community updates
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <input
              type="radio"
              name="recipient_filter"
              value="bible_year"
              checked={recipientFilter === 'bible_year'}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Bible in a Year Subscribers
              </div>
              <div className="text-sm text-gray-600">
                Members interested in Bible reading plan reminders
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <input
              type="radio"
              name="recipient_filter"
              value="skill_share"
              checked={recipientFilter === 'skill_share'}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Skill Share Subscribers
              </div>
              <div className="text-sm text-gray-600">
                Members interested in skill-sharing opportunities and workshops
              </div>
            </div>
          </label>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-900">
            <strong>{recipientCount}</strong> {recipientCount === 1 ? 'member' : 'members'} will receive
            this email
          </div>
        </div>
      </div>

      {/* Sender Address */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">From Address</h2>
        </div>
        <select
          name="from_email"
          value={selectedFrom}
          onChange={(e) => setSelectedFrom(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {senderAddresses.map((addr) => (
            <option key={addr.id} value={addr.email_address}>
              {addr.display_name} &lt;{addr.email_address}&gt;
            </option>
          ))}
        </select>
      </div>

      {/* Email Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
        </div>

        {/* Template Selection */}
        <div className="mb-6">
          <label
            htmlFor="template_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Template
          </label>
          <select
            id="template_id"
            name="template_id"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="custom">Custom Email (Compose Below)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.template_key}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate === 'custom' ? (
          <>
            {/* Custom Subject */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="custom_subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject Line *
                </label>
                <VariablePicker
                  onInsert={(variable) =>
                    setCustomSubject((prev) => prev + variable)
                  }
                />
              </div>
              <input
                type="text"
                id="custom_subject"
                name="custom_subject"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g., Important Update from Christians Innovate"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Custom Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Body *
                </label>
                <VariablePicker
                  onInsert={(variable) =>
                    setCustomBody((prev) => prev + variable)
                  }
                />
              </div>
              <EmailEditor content={customBody} onChange={setCustomBody} />
            </div>
          </>
        ) : selectedTemplateData ? (
          <>
            {/* Template Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Template Preview
              </h3>
              <div className="mb-3">
                <strong className="text-sm text-gray-600">Subject:</strong>
                <div className="text-gray-900 mt-1">
                  {selectedTemplateData.subject}
                </div>
              </div>
              <div>
                <strong className="text-sm text-gray-600">Body:</strong>
                <div
                  className="prose prose-sm max-w-none mt-2 bg-white p-4 rounded border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: selectedTemplateData.body_html }}
                />
              </div>
            </div>

            {/* Optional Subject Override */}
            <div className="mt-4">
              <label
                htmlFor="custom_subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Override Subject Line (Optional)
              </label>
              <input
                type="text"
                id="custom_subject"
                name="custom_subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Leave blank to use template subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Test Send */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Send Test</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Send this email to a single address before broadcasting to the full list.
        </p>

        <div className="flex gap-3 items-start">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => { setTestEmail(e.target.value); setTestResult(null) }}
            placeholder="test@example.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleTestSend}
            disabled={testSending || !testEmail}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            {testSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                Send Test
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {testResult.success ? `✓ Test email sent to ${testEmail}` : `✗ ${testResult.error}`}
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <SubmitButton recipientCount={recipientCount} />
      </div>
    </form>
  )
}
