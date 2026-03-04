import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TemplateForm } from '../../template-form'
import { updateTemplate } from '../../actions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface EditTemplatePageProps {
  params: Promise<{ id: string }>
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params
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

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) {
    notFound()
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
          Edit: {template.name}
        </h1>
        <p className="mt-2 text-gray-600">
          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
            {template.template_key}
          </span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <TemplateForm template={template} action={updateTemplate} />
      </div>
    </div>
  )
}
