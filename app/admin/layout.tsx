import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is an admin from database
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 items-center">
            <div className="flex items-center gap-4 sm:gap-6">
              <h2 className="text-xs sm:text-sm font-semibold">Admin</h2>
              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                <a
                  href="/admin/dashboard"
                  className="hover:text-blue-200 font-medium transition"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/plans"
                  className="hover:text-blue-200 font-medium transition"
                >
                  <span className="hidden sm:inline">Reading Plans</span>
                  <span className="sm:hidden">Plans</span>
                </a>
                <a
                  href="/admin/meetings"
                  className="hover:text-blue-200 font-medium transition"
                >
                  Meetings
                </a>
                <a
                  href="/admin/members"
                  className="hover:text-blue-200 font-medium transition"
                >
                  Members
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
