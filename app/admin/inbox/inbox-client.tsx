'use client'

import { useState } from 'react'
import { Mail, Send, Clock, Eye } from 'lucide-react'
import { InboxMessage, SenderAddress } from '@/utils/email/scheduled-jobs'
import { markAsRead } from './actions'
import ComposeModal from './compose-modal'

interface InboxClientProps {
  messages: InboxMessage[]
  senderAddresses: SenderAddress[]
  userName: string
}

export default function InboxClient({
  messages,
  senderAddresses,
  userName,
}: InboxClientProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<{ email: string; subject: string } | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null)

  const handleReply = (message: InboxMessage) => {
    setReplyTo({
      email: message.from_email,
      subject: message.subject || 'No Subject',
    })
    setIsComposeOpen(true)
  }

  const handleViewMessage = async (message: InboxMessage) => {
    setSelectedMessage(message)
    if (!message.is_read) {
      await markAsRead(message.id)
    }
  }

  const handleCloseCompose = () => {
    setIsComposeOpen(false)
    setReplyTo(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <button
              onClick={() => {
                setReplyTo(null)
                setIsComposeOpen(true)
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-6"
            >
              <Send className="w-5 h-5" />
              Compose Email
            </button>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">All Messages</span>
                </div>
                <span className="text-sm text-gray-600">{messages.length}</span>
              </div>

              {unreadCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Unread</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {unreadCount}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Sender Addresses
                </h3>
                <div className="space-y-2">
                  {senderAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {address.display_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {address.email_address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Received Messages ({messages.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure webhook in Resend:{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  /api/webhooks/resend-inbound
                </code>
                {' '}for email.received events
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Set up Resend webhook to receive incoming emails
                </p>
                <div className="text-sm text-left max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">Quick Setup:</p>
                  <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to Resend Dashboard → Webhooks</li>
                    <li>Add webhook with event: email.received</li>
                    <li>URL: <code className="bg-blue-100 px-1 rounded text-xs">https://your-domain.com/api/webhooks/resend-inbound</code></li>
                    <li>Configure email forwarding for your sender addresses</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-3">
                    See docs/RESEND_WEBHOOK_SETUP.md for detailed instructions
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">{messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${!message.is_read ? 'bg-blue-50' : ''
                      }`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          <h3 className="font-semibold text-gray-900">
                            {message.from_name || message.from_email}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {message.from_email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(message.received_at)}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="font-medium text-gray-900">
                        {message.subject || '(No Subject)'}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {message.body_text || 'No content'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReply(message)
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Reply
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewMessage(message)
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Viewer Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedMessage.subject || '(No Subject)'}
                  </h2>
                  <div className="text-sm text-gray-600">
                    From: {selectedMessage.from_name || selectedMessage.from_email}
                  </div>
                  <div className="text-sm text-gray-600">
                    To: {selectedMessage.to_email}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(selectedMessage.received_at)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleReply(selectedMessage)
                    setSelectedMessage(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Reply
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedMessage.body_html ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-900">
                  {selectedMessage.body_text || 'No content'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        senderAddresses={senderAddresses}
        replyTo={replyTo}
        userName={userName}
      />
    </>
  )
}
