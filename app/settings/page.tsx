import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'
import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '../actions'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
        </div>

        {/* Settings Form */}
        <SettingsForm
          user={user}
          profile={profile || {
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null,
            ci_updates: false,
            bible_year: false,
            skill_share: false,
            referral: null,
            skills: [],
            interests: [],
            looking_for_business_partner: false,
            looking_for_accountability_partner: false,
            bio: null,
            linkedin_url: null,
            facebook_url: null,
            twitter_url: null,
            website_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
        />

        {/* Sign Out Section */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Actions</h2>
          <p className="text-sm text-gray-600 mb-4">Sign out of your account</p>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Profile Form */}
      <ProfileForm
        user={user}
        profile={profile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null,
          ci_updates: false,
          bible_year: false,
          skill_share: false,
          referral: null,
          skills: [],
          interests: [],
          looking_for_business_partner: false,
          looking_for_accountability_partner: false,
          bio: null,
          linkedin_url: null,
          facebook_url: null,
          twitter_url: null,
          website_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }}
      />
    </>
  )
}
