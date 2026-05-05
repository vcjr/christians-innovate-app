'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Settings, Bell, LogOut } from 'lucide-react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/settings', label: 'Profile', icon: User, fullLabel: 'Profile' },
    { href: '/settings/app', label: 'App', icon: Settings, fullLabel: 'App Settings' },
    { href: '/settings/preferences', label: 'Preferences', icon: Bell, fullLabel: 'Preferences' },
    { href: '/settings/account', label: 'Account', icon: LogOut, fullLabel: 'Account' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 items-center">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
              <h2 className="text-xs sm:text-sm font-semibold whitespace-nowrap">Settings</h2>
              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`hover:text-blue-200 font-medium transition whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'text-white border-b-2 border-white' : 'text-blue-100'
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:hidden" />
                      <span className="hidden sm:inline">{item.fullLabel}</span>
                      <span className="sm:hidden">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
