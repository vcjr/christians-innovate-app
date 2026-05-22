import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Users, Rocket, FolderOpen, Target, MessageSquare, Compass } from 'lucide-react'
import { MobileMenu } from './mobile-menu'
import { UserProfileDropdown } from './user-profile-dropdown'
import { NotificationBell } from './notification-bell'
import { NavDropdown } from './nav-dropdown'

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

  // Fetch unread message count (two-step to avoid complex subquery)
  let unreadMessagesCount = 0
  const { data: userConversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
  const convIds = (userConversations || []).map(c => c.id)
  if (convIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', user.id)
    unreadMessagesCount = count ?? 0
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
            <div className="hidden md:flex gap-4 items-center">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <NavDropdown
                label="Discover"
                icon={<Compass className="h-4 w-4" />}
                items={[
                  { href: '/launch-prayer', label: 'Launch & Prayer', icon: <Rocket className="h-4 w-4" /> },
                  { href: '/resources', label: 'Resources', icon: <FolderOpen className="h-4 w-4" /> },
                ]}
              />

              <NavDropdown
                label="Community"
                icon={<Users className="h-4 w-4" />}
                items={[
                  { href: '/directory', label: 'Directory', icon: <Users className="h-4 w-4" /> },
                  { href: '/accountability', label: 'Accountability', icon: <Target className="h-4 w-4" /> },
                ]}
              />

              <Link
                href="/messages"
                className="relative flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <span className="relative">
                  <MessageSquare className="h-4 w-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-[14px] h-[14px] text-[8px] font-bold text-white bg-blue-600 rounded-full">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </span>
                Messages
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu userEmail={user.email || ''} isAdmin={isAdmin} unreadMessagesCount={unreadMessagesCount} />
          </div>
        </div>
      </div>
    </nav>
  )
}
