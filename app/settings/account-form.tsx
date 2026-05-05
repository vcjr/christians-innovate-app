'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'

export function AccountForm() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Actions</h2>
      <p className="text-sm text-gray-600 mb-4">Sign out of your account on this device</p>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
