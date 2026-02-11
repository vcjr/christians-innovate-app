import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSettingsForm } from '../app-settings-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AppSettingsPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  return (
    <>
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">App Settings</h1>
        <p className="text-gray-600 mt-2">Manage offline downloads and app installation</p>
      </div>

      {/* App Settings Form */}
      <AppSettingsForm />
    </>
  )
}
