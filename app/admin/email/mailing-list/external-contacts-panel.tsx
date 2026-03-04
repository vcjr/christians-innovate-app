'use client'

import { useState } from 'react'
import { RefreshCw, Mail, UserCheck, UserX, ExternalLink } from 'lucide-react'
import { syncContactsToResend } from './actions'

type ExternalContact = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_unsubscribed: boolean
  resend_contact_id: string | null
  last_synced_at: string | null
  notes: string | null
  created_at: string
}

type SyncResult = {
  success: boolean
  appSynced?: number
  appFailed?: number
  externalSynced?: number
  externalFailed?: number
  total?: number
  error?: string
}

interface ExternalContactsPanelProps {
  contacts: ExternalContact[]
  appMemberCount: number
}

export function ExternalContactsPanel({ contacts, appMemberCount }: ExternalContactsPanelProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const subscribed = contacts.filter((c) => !c.is_unsubscribed)
  const synced = contacts.filter((c) => c.resend_contact_id)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)

    const result = await syncContactsToResend()
    setSyncResult(result)
    setSyncing(false)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{appMemberCount}</div>
          <div className="text-xs text-gray-500 mt-1">App Members</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
          <div className="text-xs text-gray-500 mt-1">External Contacts</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{subscribed.length}</div>
          <div className="text-xs text-gray-500 mt-1">Subscribed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{synced.length}</div>
          <div className="text-xs text-gray-500 mt-1">Synced to Resend</div>
        </div>
      </div>

      {/* Sync button + result */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total mailing list: <strong>{appMemberCount + subscribed.length}</strong> recipients
          ({appMemberCount} app members + {subscribed.length} external)
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync to Resend'}
        </button>
      </div>

      {syncResult && (
        <div
          className={`rounded-lg border p-4 text-sm ${syncResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          {syncResult.success ? (
            <>
              ✅ Sync complete —{' '}
              <strong>{syncResult.total}</strong> contacts pushed to Resend
              (app: {syncResult.appSynced} synced / {syncResult.appFailed} failed,
              external: {syncResult.externalSynced} synced / {syncResult.externalFailed} failed)
            </>
          ) : (
            <>❌ {syncResult.error}</>
          )}
        </div>
      )}

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No external contacts yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add contacts via the Supabase dashboard →{' '}
            <code className="bg-gray-100 px-1 rounded">public.external_contacts</code>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Synced</th>
                <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((contact) => {
                const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{name || '—'}</div>
                      <div className="text-gray-500 text-xs">{contact.email}</div>
                      {contact.notes && (
                        <div className="text-gray-400 text-xs italic mt-0.5">{contact.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.is_unsubscribed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                          <UserX className="w-3 h-3" /> Unsubscribed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <UserCheck className="w-3 h-3" /> Subscribed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {contact.resend_contact_id ? (
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-full font-medium">
                          ✓ Resend
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not synced</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        <ExternalLink className="w-3 h-3 inline mr-1" />
        Manage contacts directly in the{' '}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Supabase dashboard
        </a>{' '}
        under <code className="bg-gray-100 px-1 rounded">public.external_contacts</code>.
      </p>
    </div>
  )
}
