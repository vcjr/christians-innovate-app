import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BroadcastForm } from './broadcast-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function BroadcastPage() {
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

  // Fetch all active email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Email Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Send Broadcast Email</h1>
        <p className="mt-2 text-gray-600">
          Send an email to members using a template or compose a custom message
        </p>
      </div>

      <BroadcastForm templates={templates || []} />
    </div>
  )
}
