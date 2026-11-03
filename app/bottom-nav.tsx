'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, Rocket, Users, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  isAdmin: boolean
  avatarUrl: string | null
  userId: string
}

export function BottomNav({ isAdmin, avatarUrl, userId }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isProfile: false,
    },
    {
      href: '/launch-prayer',
      label: 'Prayer',
      icon: Rocket,
      isProfile: false,
    },
    {
      href: '/directory',
      label: 'Directory',
      icon: Users,
      isProfile: false,
    },
    ...(isAdmin
      ? [
        {
          href: '/admin/plans',
          label: 'Admin',
          icon: Shield,
          isProfile: false,
        },
      ]
      : []),
    {
      href: '/settings',
      label: 'Settings',
      icon: User,
      isProfile: true,
    },
  ]

  // Only show max 5 items to prevent overcrowding
  const displayItems = navItems.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {displayItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1 min-w-0',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {item.isProfile && avatarUrl ? (
                <div className="relative h-5 w-5 flex-shrink-0">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <Icon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
