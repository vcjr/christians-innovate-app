'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function getAllCalendarDays(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { days: [], error: 'Not authenticated' }

  // Fetch ALL plan days (lightweight fields only) in a single query.
  // For a 365-day plan this is ~20KB — small enough to send once
  // and filter by month entirely on the client.
  const { data: days, error } = await supabase
    .from('plan_days')
    .select('id, day_number, date_assigned, scripture_reference, user_progress(is_completed)')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true })

  if (error) {
    return { days: [], error: error.message }
  }

  return { days: days || [] }
}

export async function getPlanDays(planId: string, page: number = 0, pageSize: number = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { days: [], hasMore: false }

  const from = page * pageSize
  const to = from + pageSize // fetch one extra to determine hasMore

  const { data: days, error } = await supabase
    .from('plan_days')
    .select('id, day_number, date_assigned, scripture_reference, content_markdown, created_at, user_progress(is_completed)')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true })
    .range(from, to)

  if (error || !days) return { days: [], hasMore: false }

  const hasMore = days.length > pageSize
  return { days: days.slice(0, pageSize), hasMore }
}

export async function toggleProgress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const dayId = formData.get('day_id') as string
  const currentStatus = formData.get('current_status') === 'true'

  if (currentStatus) {
    // Uncheck
    await supabase.from('user_progress').delete().match({ user_id: user.id, day_id: dayId })
  } else {
    // Check
    await supabase.from('user_progress').insert({ user_id: user.id, day_id: dayId, is_completed: true })
  }

  revalidatePath('/dashboard')
}

export async function subscribeToPlan(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('plan_subscriptions')
    .insert({ user_id: user.id, plan_id: planId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function unsubscribeFromPlan(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('plan_subscriptions')
    .delete()
    .match({ user_id: user.id, plan_id: planId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
