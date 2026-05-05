'use server'

import { createClient } from '@/utils/supabase/server'
import { ScheduledJob } from '@/utils/email/scheduled-jobs'
import { revalidatePath } from 'next/cache'

export async function getScheduledJobs() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { jobs: jobs as ScheduledJob[] }
}

export async function createScheduledJob(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const templateKey = formData.get('template_key') as string
  const scheduleType = formData.get('schedule_type') as string
  const timezone = formData.get('timezone') as string
  const hour = parseInt(formData.get('hour') as string)
  const minute = parseInt(formData.get('minute') as string)
  const dayOfWeek = formData.get('day_of_week')
    ? parseInt(formData.get('day_of_week') as string)
    : null
  const dayOfMonth = formData.get('day_of_month')
    ? parseInt(formData.get('day_of_month') as string)
    : null
  const recipientFilter = formData.get('recipient_filter') as string
  const isActive = formData.get('is_active') === 'true'

  const { data: job, error } = await supabase
    .from('scheduled_jobs')
    .insert({
      name,
      description: description || null,
      template_key: templateKey || null,
      schedule_type: scheduleType,
      timezone,
      hour,
      minute,
      day_of_week: dayOfWeek,
      day_of_month: dayOfMonth,
      recipient_filter: recipientFilter,
      is_active: isActive,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/email/scheduled-jobs')
  return { success: true, job }
}

export async function updateScheduledJob(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const templateKey = formData.get('template_key') as string
  const scheduleType = formData.get('schedule_type') as string
  const timezone = formData.get('timezone') as string
  const hour = parseInt(formData.get('hour') as string)
  const minute = parseInt(formData.get('minute') as string)
  const dayOfWeek = formData.get('day_of_week')
    ? parseInt(formData.get('day_of_week') as string)
    : null
  const dayOfMonth = formData.get('day_of_month')
    ? parseInt(formData.get('day_of_month') as string)
    : null
  const recipientFilter = formData.get('recipient_filter') as string
  const isActive = formData.get('is_active') === 'true'

  const { data: job, error } = await supabase
    .from('scheduled_jobs')
    .update({
      name,
      description: description || null,
      template_key: templateKey || null,
      schedule_type: scheduleType,
      timezone,
      hour,
      minute,
      day_of_week: dayOfWeek,
      day_of_month: dayOfMonth,
      recipient_filter: recipientFilter,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/email/scheduled-jobs')
  return { success: true, job }
}

export async function deleteScheduledJob(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    .from('scheduled_jobs')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/email/scheduled-jobs')
  return { success: true }
}

export async function toggleJobStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    .from('scheduled_jobs')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/email/scheduled-jobs')
  return { success: true }
}
