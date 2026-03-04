import { createClient } from '@/utils/supabase/server'
import { MemberList } from './member-list'

export default async function MembersPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Ensure current user has a profile
  if (currentUser) {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (!existingProfile) {
      // Create profile for current user if it doesn't exist
      await supabase
        .from('user_profiles')
        .insert({
          user_id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          ci_updates: false,
          bible_year: false,
          skill_share: false
        })
    }
  }

  // Fetch all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading members: {profilesError.message}
      </div>
    )
  }

  // Fetch all user roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('*')

  // Combine profiles with their roles (email now in user_profiles)
  const users = profiles?.map(profile => ({
    ...profile,
    user_roles: roles?.filter(role => role.user_id === profile.user_id) || []
  })) || []

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Members</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage user accounts and permissions</p>
      </div>

      <MemberList members={users || []} />
    </div>
  )
}
