'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createPlan(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  const { error } = await supabase
    .from('reading_plans')
    .insert({
      title,
      description,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/plans')
  return { success: true }
}

export async function setDefaultPlan(planId: string) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: role } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  if (!role?.is_admin) return { error: 'Not authorized' }

  // Clear any existing default first
  const { error: clearError } = await supabase
    .from('reading_plans')
    .update({ is_default: false })
    .eq('is_default', true)

  if (clearError) return { error: clearError.message }

  // Set the new default
  const { error } = await supabase
    .from('reading_plans')
    .update({ is_default: true })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath('/admin/plans')
  return { success: true }
}

export async function deletePlan(planId: string) {
  const supabase = await createClient()

  // Delete all associated plan_days first (cascade should handle this, but being explicit)
  const { error: daysError } = await supabase
    .from('plan_days')
    .delete()
    .eq('plan_id', planId)

  if (daysError) {
    return { error: daysError.message }
  }

  // Delete the plan
  const { error } = await supabase
    .from('reading_plans')
    .delete()
    .eq('id', planId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/plans')
  return { success: true }
}
