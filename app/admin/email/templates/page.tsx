import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateList } from './template-list'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EmailTemplatesPage() {
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

  // Fetch all email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Email Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="mt-2 text-gray-600">
          Create and manage email templates with WYSIWYG editor
        </p>
      </div>

      <TemplateList templates={templates || []} />
    </div>
  )
}
