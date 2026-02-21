'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { sendFromInbox } from './actions'
import { SenderAddress } from '@/utils/email/scheduled-jobs'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  senderAddresses: SenderAddress[]
  replyTo?: { email: string; subject: string } | null
  userName: string
}

export default function ComposeModal({
  isOpen,
  onClose,
  senderAddresses,
  replyTo,
  userName,
}: ComposeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [sendAsMyself, setSendAsMyself] = useState(false)
  const [fromEmail, setFromEmail] = useState(
    senderAddresses[0]?.email_address || ''
  )
  const [emailPrefix, setEmailPrefix] = useState('')
  const [fromName, setFromName] = useState(userName)
  const [toEmail, setToEmail] = useState(replyTo?.email || '')
  const [subject, setSubject] = useState(
    replyTo?.subject ? `Re: ${replyTo.subject}` : ''
  )
  const [body, setBody] = useState('')

  // Extract domain from first sender address
  const domain = senderAddresses[0]?.email_address.split('@')[1] || 'christiansinnovate.com'
  const customEmail = emailPrefix ? `${emailPrefix}@${domain}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validate custom email prefix if sending as custom
    if (sendAsMyself && !emailPrefix) {
      setError('Please enter an email prefix')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('from_email', sendAsMyself ? customEmail : fromEmail)
    formData.append('from_name', sendAsMyself ? fromName : '')
    formData.append('to_email', toEmail)
    formData.append('subject', subject)
    formData.append('body', body)
    formData.append('send_as_myself', sendAsMyself.toString())

    const result = await sendFromInbox(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        onClose()
        setToEmail('')
        setSubject('')
        setBody('')
        setEmailPrefix('')
        setSendAsMyself(false)
        setSuccess(false)
      }, 1500)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {replyTo ? 'Reply to Email' : 'Compose Email'}
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

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm">
              ✓ Email sent successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From *
            </label>
            
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAsMyself}
                  onChange={(e) => setSendAsMyself(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Send with custom email address
                </span>
              </label>
            </div>

            {sendAsMyself ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email Address *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={emailPrefix}
                      onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your-name"
                    />
                    <span className="text-gray-600">@{domain}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a custom email prefix (e.g., victor, support, john)
                  </p>
                  {customEmail && (
                    <p className="text-xs text-blue-600 mt-1">
                      Will send from: {customEmail}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name will appear in the recipient&apos;s inbox
                  </p>
                </div>
              </div>
            ) : (
              <>
                <select
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {senderAddresses.map((address) => (
                    <option key={address.id} value={address.email_address}>
                      {address.display_name} ({address.email_address})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose which sender address to use
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To *
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Write your message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Line breaks will be converted to HTML &lt;br&gt; tags
            </p>
          </div>

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
