import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ResourceUploadForm } from './resource-upload-form'
import { ResourceFilters } from './resource-filters'
import { FileText, Link as LinkIcon, FolderOpen } from 'lucide-react'

export default async function ResourcesPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  const isAdmin = userRole?.is_admin || false

  // Fetch all resources with user profiles
  const { data: allResources, error: fetchError } = await supabase
    .from('resources')
    .select(`
      *,
      user_profiles(
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching resources:', fetchError)
  }

  // Filter resources based on user role
  // Users see their own resources + active non-hidden community resources
  // Admins see all resources
  const userResources = allResources?.filter(r => r.user_id === user.id) || []
  const communityResources = allResources?.filter(r =>
    r.user_id !== user.id &&
    r.is_active &&
    !r.is_hidden
  ) || []

  const displayResources = isAdmin ? (allResources || []) : [...userResources, ...communityResources]

  // Calculate stats
  const totalResources = displayResources.filter(r => r.is_active && !r.is_hidden).length
  const fileResources = displayResources.filter(r => r.file_url && r.is_active && !r.is_hidden).length
  const linkResources = displayResources.filter(r => r.external_url && !r.file_url && r.is_active && !r.is_hidden).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Hub</h1>
          <p className="text-gray-600">
            Share and discover valuable tools, documents, and links with the community
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <FolderOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
            <p className="text-sm text-gray-600">Total Resources</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{fileResources}</p>
            <p className="text-sm text-gray-600">File Uploads</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <LinkIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{linkResources}</p>
            <p className="text-sm text-gray-600">External Links</p>
          </div>
        </div>

        {/* Create Form */}
        <div className="mb-8">
          <ResourceUploadForm />
        </div>

        {/* Resource List with Filters */}
        <ResourceFilters
          resources={displayResources}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
