import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateGroupForm } from './create-group-form'

export default async function CreateGroupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Accountability Group</h1>
          <p className="text-gray-600 mt-2">Set up your group and start inviting members</p>
        </header>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <CreateGroupForm />
        </div>
      </div>
    </div>
  )
}
