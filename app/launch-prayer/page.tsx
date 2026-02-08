import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreatePostForm } from './create-post-form'
import { PostList } from './post-list'
import { Rocket, Heart, Trophy } from 'lucide-react'

export default async function LaunchPrayerPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  const isAdmin = userRole?.is_admin || false

  // Fetch all posts with user profiles
  const { data: allPosts, error: fetchError } = await supabase
    .from('launch_prayer_posts')
    .select(`
      *,
      user_profiles(
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  // Log any fetch errors for debugging
  if (fetchError) {
    console.error('Error fetching launch prayer posts:', fetchError)
  }

  // Log the raw data for debugging
  console.log('Fetched posts count:', allPosts?.length || 0)
  console.log('User ID:', user.id)
  console.log('Is Admin:', isAdmin)

  // Fetch user's own posts (including inactive ones)
  const userPosts = allPosts?.filter(post => post.user_id === user.id) || []

  // Fetch active, non-hidden posts from others
  const communityPosts = allPosts?.filter(post =>
    post.user_id !== user.id &&
    post.is_active &&
    !post.is_hidden
  ) || []

  console.log('User posts:', userPosts.length)
  console.log('Community posts:', communityPosts.length)

  // If admin, show all posts
  const displayPosts = isAdmin ? (allPosts || []) : [...userPosts, ...communityPosts]

  console.log('Display posts:', displayPosts.length)

  // Calculate counts for stats
  const launchCount = displayPosts.filter(p => p.type === 'launch' && p.is_active && !p.is_hidden).length
  const prayerCount = displayPosts.filter(p => p.type === 'prayer' && p.is_active && !p.is_hidden).length
  const winCount = displayPosts.filter(p => p.type === 'win' && p.is_active && !p.is_hidden).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Launch & Prayer</h1>
          <p className="text-gray-600">
            Share your launches, prayer requests, and wins with the community
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <Rocket className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{launchCount}</p>
            <p className="text-sm text-gray-600">Launches</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{prayerCount}</p>
            <p className="text-sm text-gray-600">Prayer Requests</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{winCount}</p>
            <p className="text-sm text-gray-600">Wins</p>
          </div>
        </div>

        {/* Create Post Form */}
        <div className="mb-8">
          <CreatePostForm />
        </div>

        {/* Debug Info */}
        {fetchError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-semibold">Error fetching posts:</p>
            <p className="text-xs text-red-500 mt-1">{fetchError.message}</p>
          </div>
        )}

        {/* Posts List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Updates</h2>
          <p className="text-sm text-gray-500 mb-2">Total posts: {displayPosts.length}</p>
          <PostList posts={displayPosts} currentUserId={user.id} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  )
}
