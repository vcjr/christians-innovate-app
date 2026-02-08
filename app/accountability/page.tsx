import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AccountabilityHub from '@/components/accountability-hub'
import { PendingInvitations } from '@/components/pending-invitations'
import Link from 'next/link'
import { Target } from 'lucide-react'

export default async function AccountabilityPage() {
  const supabase = await createClient()

  // Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Get user's profile with group membership
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accountability_group_id, full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  // If user is not in a group, show onboarding + pending invitations
  if (!profile?.accountability_group_id) {
    // Fetch pending invitations for this user
    const { data: rawInvitations } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Enrich invitations with group and inviter info
    const invitations = await Promise.all(
      (rawInvitations || []).map(async (inv) => {
        const { data: group } = await supabase
          .from('accountability_groups')
          .select('name, target_objective')
          .eq('id', inv.group_id)
          .single()

        const { data: inviter } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', inv.invited_by)
          .single()

        return {
          ...inv,
          group: group || { name: 'Unknown Group', target_objective: '' },
          inviter: inviter || { full_name: null, avatar_url: null },
        }
      })
    )

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              Accountability Hub
            </h1>
            <p className="text-gray-600 mt-2">Join or create an accountability group to stay on track together</p>
          </header>

          {/* Create Group or Browse Directory */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Create a Group</h2>
              <p className="text-gray-600 mb-4">Start your own accountability group and invite others to join</p>
              <Link
                href="/accountability/create"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Group
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Find Partners</h2>
              <p className="text-gray-600 mb-4">Browse the directory to find accountability partners</p>
              <Link
                href="/directory"
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Browse Directory
              </Link>
            </div>
          </div>

          {/* Pending Invitations */}
          <PendingInvitations invitations={invitations} />

          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What is an Accountability Group?</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex gap-2">
                <span>✓</span>
                <span>Make and track commitments with your group members</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Schedule regular check-in meetings</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Reflect on progress and support each other</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Build momentum toward shared goals</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // User is in a group - fetch group data
  const { data: group } = await supabase
    .from('accountability_groups')
    .select('*')
    .eq('id', profile.accountability_group_id)
    .single()

  // Fetch group members
  const { data: members } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url, email')
    .eq('accountability_group_id', profile.accountability_group_id)

  // Fetch group commitments
  const { data: rawCommitments, error: commitmentsError } = await supabase
    .from('group_commitments')
    .select('*')
    .eq('group_id', profile.accountability_group_id)
    .order('created_at', { ascending: false })

  // Fetch user profiles for the commitments
  const userIds = rawCommitments?.map(c => c.user_id) || []
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', userIds)

  // Join the data manually
  const commitments = rawCommitments?.map(commitment => ({
    ...commitment,
    user: userProfiles?.find(u => u.user_id === commitment.user_id) || { full_name: null, avatar_url: null }
  })) || []

  console.log('Commitments query result:', { commitments, commitmentsError, groupId: profile.accountability_group_id })

  // Fetch group reflections (debrief sessions)
  const { data: rawReflections } = await supabase
    .from('debrief_sessions')
    .select('*')
    .eq('group_id', profile.accountability_group_id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch user profiles for the reflections
  const reflectionUserIds = rawReflections?.map(r => r.facilitator_id) || []
  const { data: reflectionUserProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', reflectionUserIds)

  const reflections = rawReflections?.map(reflection => ({
    ...reflection,
    user: reflectionUserProfiles?.find(u => u.user_id === reflection.facilitator_id) || { full_name: null, avatar_url: null }
  })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AccountabilityHub
          group={group}
          members={members || []}
          commitments={commitments || []}
          reflections={reflections}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
