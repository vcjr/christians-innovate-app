import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, Users, Target, ArrowLeft } from 'lucide-react'
import { JoinRequestButton } from '@/components/join-request-button'

export default async function DiscoverGroupsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // All groups
  const { data: groups } = await supabase
    .from('accountability_groups')
    .select('id, name, target_objective, created_by, created_at')
    .order('created_at', { ascending: false })

  const groupIds = (groups || []).map(g => g.id)

  // User's current memberships
  const { data: userMemberships } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', user.id)
  const memberGroupIds = new Set((userMemberships || []).map(m => m.group_id))

  // User's pending join requests
  const { data: userRequests } = await supabase
    .from('group_join_requests')
    .select('id, group_id, status')
    .eq('requester_id', user.id)
  const requestByGroupId = new Map((userRequests || []).map(r => [r.group_id, r]))

  // All memberships for member counts and avatars
  const { data: allMemberships } = groupIds.length > 0
    ? await supabase.from('user_group_memberships').select('group_id, user_id').in('group_id', groupIds)
    : { data: [] }

  const memberUserIdsByGroup = new Map<string, string[]>()
  for (const m of (allMemberships || [])) {
    const list = memberUserIdsByGroup.get(m.group_id) || []
    list.push(m.user_id)
    memberUserIdsByGroup.set(m.group_id, list)
  }

  // Batch fetch profiles for all members
  const allMemberUserIds = [...new Set((allMemberships || []).map(m => m.user_id))]
  const { data: profiles } = allMemberUserIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, full_name, avatar_url').in('user_id', allMemberUserIds)
    : { data: [] }
  const profilesById = new Map((profiles || []).map(p => [p.user_id, p]))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/accountability" className="text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-7 w-7 text-blue-600" />
            Discover Groups
          </h1>
        </div>
        <p className="text-gray-600 mb-8 ml-8">Find and join accountability groups that align with your goals.</p>

        {(!groups || groups.length === 0) ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No groups yet. Be the first to create one!</p>
            <Link
              href="/accountability/create"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Create a Group
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => {
              const memberIds = memberUserIdsByGroup.get(group.id) || []
              const memberCount = memberIds.length
              const previewProfiles = memberIds.slice(0, 4).map(id => profilesById.get(id)).filter(Boolean)
              const isMember = memberGroupIds.has(group.id)
              const existingRequest = requestByGroupId.get(group.id)

              return (
                <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
                        {isMember && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Member</span>
                        )}
                      </div>
                      <div className="flex items-start gap-1.5 text-sm text-gray-600 mb-3">
                        <Target className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{group.target_objective}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {previewProfiles.map((profile, i) => (
                            profile?.avatar_url ? (
                              <img
                                key={i}
                                src={profile.avatar_url}
                                alt={profile.full_name || ''}
                                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div
                                key={i}
                                className="w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white text-[10px] font-semibold"
                              >
                                {(profile?.full_name || '?').charAt(0).toUpperCase()}
                              </div>
                            )
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isMember ? (
                        <Link
                          href={`/accountability?group=${group.id}`}
                          className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition"
                        >
                          View Group
                        </Link>
                      ) : (
                        <JoinRequestButton
                          groupId={group.id}
                          existingRequest={existingRequest ? { id: existingRequest.id, status: existingRequest.status } : null}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
