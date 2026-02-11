import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PreferencesForm } from '../preferences-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function PreferencesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Newsletter Preferences
        </h1>

        <PreferencesForm user={user} profile={profile} />
      </div>
    </div>
  )
}
