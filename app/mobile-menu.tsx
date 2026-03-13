'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Shield, LogOut, Menu, X, Settings, Users, Rocket, FolderOpen } from 'lucide-react'
import { signOut } from './actions'

export function MobileMenu({ userEmail, isAdmin }: { userEmail: string; isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-16 right-0 left-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="px-4 py-6 space-y-4">
              {/* User Email */}
              <div className="pb-4 border-b border-gray-200">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 truncate block"
                >
                  {userEmail}
                </Link>
              </div>

              {/* Navigation Links */}
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 font-medium py-2"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>

              <Link
                href="/launch-prayer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 font-medium py-2"
              >
                <Rocket className="h-5 w-5" />
                Launch & Prayer
              </Link>

              <Link
                href="/directory"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 font-medium py-2"
              >
                <Users className="h-5 w-5" />
                Directory
              </Link>

              <Link
                href="/resources"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 font-medium py-2"
              >
                <FolderOpen className="h-5 w-5" />
                Resources
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-800 font-medium py-2"
                >
                  <Shield className="h-5 w-5" />
                  Admin
                </Link>
              )}

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 font-medium py-2"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>

              {/* Sign Out */}
              <form action={signOut} className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center gap-3 text-gray-900 hover:text-red-600 font-medium py-2 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
