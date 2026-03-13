'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createResource(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const externalUrl = formData.get('external_url') as string | null
  const fileUrl = formData.get('file_url') as string | null

  if (!title || !category) {
    return { error: 'Title and category are required' }
  }

  if (!fileUrl && !externalUrl) {
    return { error: 'Either a file or external URL is required' }
  }

  const { error } = await supabase
    .from('resources')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      file_url: fileUrl || null,
      external_url: externalUrl || null,
      is_active: true
    })

  if (error) {
    console.error('Error creating resource:', error)
    return { error: error.message }
  }

  revalidatePath('/resources')
  return { success: true }
}

export async function deleteResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // First, get the resource to check ownership and get file URL
  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('user_id, file_url')
    .eq('id', resourceId)
    .single()

  if (fetchError || !resource) {
    return { error: 'Resource not found' }
  }

  if (resource.user_id !== user.id) {
    return { error: 'Not authorized to delete this resource' }
  }

  // Delete file from storage if it exists
  if (resource.file_url) {
    // Extract the file path from the URL
    const urlParts = resource.file_url.split('/resources/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabase.storage.from('resources').remove([filePath])
    }
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/resources')
  return { success: true }
}

export async function toggleResourceActive(resourceId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('resources')
    .update({ is_active: !currentStatus })
    .eq('id', resourceId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/resources')
  return { success: true }
}

// Admin actions
export async function adminHideResource(resourceId: string, shouldHide: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('resources')
    .update({ is_hidden: shouldHide })
    .eq('id', resourceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/resources')
  return { success: true }
}

export async function adminDeleteResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  // Get file URL to delete from storage
  const { data: resource } = await supabase
    .from('resources')
    .select('file_url')
    .eq('id', resourceId)
    .single()

  // Delete file from storage if it exists
  if (resource?.file_url) {
    const urlParts = resource.file_url.split('/resources/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabase.storage.from('resources').remove([filePath])
    }
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/resources')
  return { success: true }
}

export async function uploadResourceFile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Create unique filename with timestamp
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`

  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resources')
    .getPublicUrl(filePath)

  return { success: true, fileUrl: publicUrl }
}
