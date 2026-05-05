import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Users, Rocket, FolderOpen, Target } from 'lucide-react'
import { UserProfileDropdown } from './user-profile-dropdown'
import { NotificationBell } from './notification-bell'

// Routes where the nav should never render, even for authenticated users
const NAV_HIDDEN_ROUTES = ['/reset-password', '/onboarding']

export async function NavigationBar() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  if (NAV_HIDDEN_ROUTES.some(route => pathname.startsWith(route))) {
    return null
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user is admin from database
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  const isAdmin = userRole?.is_admin === true

  // Fetch user profile for avatar and name
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Christians Innovate"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-base sm:text-xl font-bold text-gray-900 truncate">Christians Innovate</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/launch-prayer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <Rocket className="h-4 w-4" />
                Launch & Prayer
              </Link>

              <Link
                href="/directory"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <Users className="h-4 w-4" />
                Directory
              </Link>

              <Link
                href="/resources"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <FolderOpen className="h-4 w-4" />
                Resources
              </Link>

              <Link
                href="/accountability"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <Target className="h-4 w-4" />
                Accountability
              </Link>
            </div>
          </div>

          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell
              notifications={notifications || []}
              unreadCount={unreadCount || 0}
              userId={user.id}
            />
            <UserProfileDropdown
              fullName={userProfile?.full_name || null}
              avatarUrl={userProfile?.avatar_url || null}
              userId={user.id}
              isAdmin={isAdmin}
            />
          </div>

          {/* Mobile - Show user profile only */}
          <div className="md:hidden">
            <UserProfileDropdown
              fullName={userProfile?.full_name || null}
              avatarUrl={userProfile?.avatar_url || null}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
