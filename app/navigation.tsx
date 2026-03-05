import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Shield, LogOut, Users, Rocket, FolderOpen } from 'lucide-react'
import { signOut } from './actions'
import { MobileMenu } from './mobile-menu'
import { UserProfileDropdown } from './user-profile-dropdown'

export async function NavigationBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null // No nav for unauthenticated users
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

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center gap-4">
            <UserProfileDropdown
              fullName={userProfile?.full_name || null}
              avatarUrl={userProfile?.avatar_url || null}
              userId={user.id}
            />
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu userEmail={user.email || ''} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </nav>
  )
}
