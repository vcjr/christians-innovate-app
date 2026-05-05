import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AccountabilityHub from '@/components/accountability-hub'
import { PendingInvitations } from '@/components/pending-invitations'
import { PendingJoinRequests } from '@/components/pending-join-requests'
import Link from 'next/link'
import { Target } from 'lucide-react'

export default async function AccountabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const supabase = await createClient()
  const { group: selectedGroupId } = await searchParams

  // Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Get all groups the user belongs to (via junction table)
  const { data: memberships } = await supabase
    .from('user_group_memberships')
    .select('accountability_groups(id, name, target_objective, created_by, rhythm_config, created_at, updated_at)')
    .eq('user_id', user.id)

  type GroupRow = {
    id: string
    name: string
    target_objective: string
    created_by: string
    rhythm_config: { frequency: string; day: string; time: string } | null
    created_at: string
    updated_at: string
  }

  const userGroups = (memberships || [])
    .map(m => m.accountability_groups as unknown as GroupRow)
    .filter(Boolean)

  // Fetch pending join requests for groups the user created
  const createdGroupIds = userGroups.filter(g => g.created_by === user.id).map(g => g.id)
  let pendingJoinRequests: Array<{ id: string; group_id: string; requester_id: string; created_at: string; message: string | null }> = []
  if (createdGroupIds.length > 0) {
    const { data: joinReqs } = await supabase
      .from('group_join_requests')
      .select('id, group_id, requester_id, created_at, message')
      .in('group_id', createdGroupIds)
      .eq('status', 'pending')
    pendingJoinRequests = joinReqs || []
  }

  // Batch fetch requester profiles
  const requesterIds = [...new Set(pendingJoinRequests.map(r => r.requester_id))]
  const { data: requesterProfiles } = requesterIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, full_name, avatar_url').in('user_id', requesterIds)
    : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] }
  const requesterProfilesById = new Map((requesterProfiles || []).map(p => [p.user_id, p]))

  // If user is not in any group, show onboarding + pending invitations
  if (userGroups.length === 0) {
    const { data: rawInvitations } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const invitationsList = rawInvitations || []

    // Batch-fetch groups and inviters to avoid N+1 queries
    const groupIds = [...new Set(invitationsList.map(inv => inv.group_id).filter(Boolean))]
    const inviterIds = [...new Set(invitationsList.map(inv => inv.invited_by).filter(Boolean))]

    const [groupsResult, invitersResult] = await Promise.all([
      groupIds.length > 0
        ? supabase.from('accountability_groups').select('id, name, target_objective').in('id', groupIds)
        : Promise.resolve({ data: [] }),
      inviterIds.length > 0
        ? supabase.from('user_profiles').select('user_id, full_name, avatar_url').in('user_id', inviterIds)
        : Promise.resolve({ data: [] }),
    ])

    const groupsById = (groupsResult.data || []).reduce<Record<string, { name: string; target_objective: string }>>((acc, g) => {
      acc[g.id] = g
      return acc
    }, {})
    const invitersById = (invitersResult.data || []).reduce<Record<string, { full_name: string | null; avatar_url: string | null }>>((acc, u) => {
      acc[u.user_id] = u
      return acc
    }, {})

    const invitations = invitationsList.map(inv => ({
      ...inv,
      group: groupsById[inv.group_id] || { name: 'Unknown Group', target_objective: '' },
      inviter: invitersById[inv.invited_by] || { full_name: null, avatar_url: null },
    }))

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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Create a Group</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">Start your own accountability group and invite others to join</p>
              <Link
                href="/accountability/create"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Group
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Find Partners</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">Browse the directory to find accountability partners</p>
              <Link
                href="/directory"
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Browse Directory
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Discover Groups</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">Browse existing groups and request to join one that fits your goals</p>
              <Link
                href="/accountability/discover"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Browse Groups
              </Link>
            </div>
          </div>

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

  // Determine active group from query param, defaulting to first group
  const activeGroup = userGroups.find(g => g.id === selectedGroupId) ?? userGroups[0]

  const joinRequestsForActiveGroup = pendingJoinRequests
    .filter(r => r.group_id === activeGroup.id)
    .map(r => ({
      ...r,
      requester: requesterProfilesById.get(r.requester_id) ?? { full_name: null, avatar_url: null },
    }))

  // Fetch members of the active group via junction table
  const { data: memberMemberships } = await supabase
    .from('user_group_memberships')
    .select('user_id')
    .eq('group_id', activeGroup.id)

  const memberIds = (memberMemberships || []).map(m => m.user_id)
  const { data: members } = memberIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, full_name, avatar_url, email').in('user_id', memberIds)
    : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null; email: string | null }[] }

  // Fetch commitments for the active group
  const { data: rawCommitments } = await supabase
    .from('group_commitments')
    .select('*')
    .eq('group_id', activeGroup.id)
    .order('created_at', { ascending: false })

  // Batch-fetch user profiles for commitments
  const commitmentUserIds = [...new Set((rawCommitments || []).map(c => c.user_id))]
  const { data: commitmentProfiles } = commitmentUserIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, full_name, avatar_url').in('user_id', commitmentUserIds)
    : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] }

  const profilesByUserId = (commitmentProfiles || []).reduce<Record<string, { full_name: string | null; avatar_url: string | null }>>((acc, u) => {
    acc[u.user_id] = u
    return acc
  }, {})

  const commitments = (rawCommitments || []).map(commitment => ({
    ...commitment,
    user: profilesByUserId[commitment.user_id] ?? { full_name: null, avatar_url: null },
  }))

  // Fetch reflections for the active group
  const { data: rawReflections } = await supabase
    .from('debrief_sessions')
    .select('*')
    .eq('group_id', activeGroup.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reflectionUserIds = [...new Set((rawReflections || []).map(r => r.facilitator_id))]
  const { data: reflectionProfiles } = reflectionUserIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, full_name, avatar_url').in('user_id', reflectionUserIds)
    : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] }

  const reflectionProfilesById = (reflectionProfiles || []).reduce<Record<string, { full_name: string | null; avatar_url: string | null }>>((acc, u) => {
    acc[u.user_id] = u
    return acc
  }, {})

  const reflections = (rawReflections || []).map(reflection => ({
    ...reflection,
    user: reflectionProfilesById[reflection.facilitator_id] ?? { full_name: null, avatar_url: null },
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Group switcher — always shown so users can navigate between groups or create a new one */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 font-medium mr-1">My Groups:</span>
          {userGroups.map(g => (
            <Link
              key={g.id}
              href={`/accountability?group=${g.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                g.id === activeGroup.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {g.name}
            </Link>
          ))}
          <Link
            href="/accountability/create"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition"
          >
            + New Group
          </Link>
          <Link
            href="/accountability/discover"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 transition ml-auto"
          >
            Discover Groups
          </Link>
        </div>
      </div>

      {/* Pending join requests for group creators */}
      {joinRequestsForActiveGroup.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
          <PendingJoinRequests
            requests={joinRequestsForActiveGroup}
            groupName={activeGroup.name}
          />
        </div>
      )}

      <AccountabilityHub
        group={activeGroup}
        members={members || []}
        commitments={commitments}
        reflections={reflections}
        currentUserId={user.id}
      />
    </div>
  )
}
