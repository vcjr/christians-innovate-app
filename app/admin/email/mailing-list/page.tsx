import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ExternalContactsPanel } from './external-contacts-panel'

export default async function MailingListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) redirect('/dashboard')

  // Fetch external contacts
  const { data: externalContacts } = await supabase
    .from('external_contacts')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch app member count
  const { count: appMemberCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin/email"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Email Management
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Mailing List</h1>
        <p className="mt-2 text-gray-600">
          Track and sync external contacts who receive meeting reminders but aren&apos;t yet app members.
        </p>
      </div>

      <ExternalContactsPanel
        contacts={externalContacts ?? []}
        appMemberCount={appMemberCount ?? 0}
      />
    </div>
  )
}
