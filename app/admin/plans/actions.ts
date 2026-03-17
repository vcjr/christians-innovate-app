'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

export async function setDefaultPlan(planId: string) {
  const supabase = await createClient();

  // Use a database transaction to prevent race conditions.
  const { data, error } = await supabase.rpc('set_default_plan_atomic', {
    new_default_plan_id: planId
  });

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/plans');
  return { success: true };
  
}

