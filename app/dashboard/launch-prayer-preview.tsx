import { createClient } from '@/utils/supabase/server'
import { Rocket, Heart, Trophy } from 'lucide-react'
import Link from 'next/link'

export async function LaunchPrayerPreview() {
  const supabase = await createClient()

  // Get counts for each type of active post
  const { count: launchCount } = await supabase
    .from('launch_prayer_posts')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'launch')
    .eq('is_active', true)
    .eq('is_hidden', false)

  const { count: prayerCount } = await supabase
    .from('launch_prayer_posts')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'prayer')
    .eq('is_active', true)
    .eq('is_hidden', false)

  const { count: winCount } = await supabase
    .from('launch_prayer_posts')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'win')
    .eq('is_active', true)
    .eq('is_hidden', false)

  const totalCount = (launchCount || 0) + (prayerCount || 0) + (winCount || 0)

  return (
    <Link href="/launch-prayer">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointe mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Launch & Prayer</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Rocket className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{launchCount || 0}</p>
            <p className="text-xs text-gray-600">Launches</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{prayerCount || 0}</p>
            <p className="text-xs text-gray-600">Prayers</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{winCount || 0}</p>
            <p className="text-xs text-gray-600">Wins</p>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {totalCount} active {totalCount === 1 ? 'post' : 'posts'} from the community
            </p>
          </div>
        )}

        {totalCount === 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Be the first to share!
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
