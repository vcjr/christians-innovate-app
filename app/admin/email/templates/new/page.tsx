import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateForm } from '../template-form'
import { createTemplate } from '../actions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewTemplatePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin/email/templates"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Templates
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Email Template
        </h1>
        <p className="mt-2 text-gray-600">
          Build a new email template using the visual block editor or raw HTML
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <TemplateForm action={createTemplate} />
      </div>
    </div>
  )
}
