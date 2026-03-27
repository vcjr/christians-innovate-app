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
  linkedin_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  website_url: string | null
}

export default async function DirectoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Fetch all groups this user is creator of
  const { data: ownedGroups } = await supabase
    .from('accountability_groups')
    .select('id, name')
    .eq('created_by', user.id)
    .order('created_at', { ascending: true })

  const ownedGroupIds = (ownedGroups || []).map(g => g.id)

  // Batch-fetch members and pending invites for all owned groups
  const membershipByGroup: Record<string, string[]> = {}
  const pendingByGroup: Record<string, string[]> = {}

  if (ownedGroupIds.length > 0) {
    const [{ data: allMemberships }, { data: allPending }] = await Promise.all([
      supabase.from('user_group_memberships').select('group_id, user_id').in('group_id', ownedGroupIds),
      supabase.from('group_invitations').select('group_id, invited_user_id').in('group_id', ownedGroupIds).eq('status', 'pending'),
    ])

    for (const m of (allMemberships || [])) {
      membershipByGroup[m.group_id] = [...(membershipByGroup[m.group_id] || []), m.user_id]
    }
    for (const p of (allPending || [])) {
      pendingByGroup[p.group_id] = [...(pendingByGroup[p.group_id] || []), p.invited_user_id]
    }
  }

  // Fetch all user profiles (accountability_group_id column no longer exists)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, user_id, full_name, avatar_url, bio, skills, interests, looking_for_business_partner, looking_for_accountability_partner, linkedin_url, facebook_url, twitter_url, website_url')
    .order('full_name', { ascending: true })

  return (
    <DirectoryClient
      profiles={(profiles || []) as UserProfile[]}
      currentUserId={user.id}
      ownedGroups={ownedGroups || []}
      membershipByGroup={membershipByGroup}
      pendingByGroup={pendingByGroup}
    />
  )
}
