import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DirectoryClient } from './directory-client'

interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  skills: string[]
  interests: string[]
  looking_for_business_partner: boolean
  looking_for_accountability_partner: boolean
  accountability_group_id: string | null
  linkedin_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  website_url: string | null
}

export default async function DirectoryPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Get current user's profile to check if they're in a group
  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id')
    .eq('user_id', user.id)
    .single()

  // Check if user is the group creator
  let isGroupCreator = false
  if (currentUserProfile?.accountability_group_id) {
    const { data: group } = await supabase
      .from('accountability_groups')
      .select('created_by')
      .eq('id', currentUserProfile.accountability_group_id)
      .single()
    isGroupCreator = group?.created_by === user.id
  }

  // Fetch pending invitations sent by this user's group
  let pendingInvitedUserIds: string[] = []
  if (isGroupCreator && currentUserProfile?.accountability_group_id) {
    const { data: pendingInvites } = await supabase
      .from('group_invitations')
      .select('invited_user_id')
      .eq('group_id', currentUserProfile.accountability_group_id)
      .eq('status', 'pending')

    pendingInvitedUserIds = (pendingInvites || []).map(i => i.invited_user_id)
  }

  // Fetch all user profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .order('full_name', { ascending: true })

  const memberProfiles = (profiles || []) as UserProfile[]

  return (
    <DirectoryClient
      profiles={memberProfiles}
      currentUserId={user.id}
      userGroupId={currentUserProfile?.accountability_group_id || null}
      isGroupCreator={isGroupCreator}
      pendingInvitedUserIds={pendingInvitedUserIds}
    />
  )
}
