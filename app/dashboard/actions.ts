'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { CalendarDay, PlanDay } from './types'

export async function getAllCalendarDays(planId: string): Promise<{ days: CalendarDay[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { days: [], error: 'Not authenticated' }

  // Fetch ALL plan days (lightweight fields only) in a single query.
  // For a 365-day plan this is ~20KB — small enough to send once
  // and filter by month entirely on the client.
  const { data: days, error } = await supabase
    .from('plan_days')
    .select('id, day_number, date_assigned, scripture_reference')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true })

  if (error) return { days: [], error: error.message }

  // Fetch progress in a separate query with an explicit user_id filter.
  // Do NOT use the nested relationship syntax (user_progress(is_completed)) because
  // it relies entirely on RLS to scope results — if RLS is misconfigured another
  // user's progress leaks through and shows as the current user's completed days.
  const dayIds = (days || []).map(d => d.id)
  const progressByDayId = new Map<string, boolean>()
  if (dayIds.length > 0) {
    const { data: progressRows } = await supabase
      .from('user_progress')
      .select('day_id, is_completed')
      .eq('user_id', user.id)
      .in('day_id', dayIds)
    for (const row of progressRows || []) {
      progressByDayId.set(row.day_id, row.is_completed)
    }
  }

  const daysWithProgress: CalendarDay[] = (days || []).map(d => ({
    ...d,
    user_progress: progressByDayId.has(d.id) ? [{ is_completed: progressByDayId.get(d.id)! }] : [],
  }))

  return { days: daysWithProgress }
}

export async function getPlanDays(planId: string, page: number = 0, pageSize: number = 10): Promise<{ days: PlanDay[]; hasMore: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { days: [], hasMore: false }

  const from = page * pageSize
  const to = from + pageSize // fetch one extra to determine hasMore

  const { data: days, error } = await supabase
    .from('plan_days')
    .select('id, day_number, date_assigned, scripture_reference, content_markdown, created_at')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true })
    .range(from, to)

  if (error || !days) return { days: [], hasMore: false }

  const dayIds = days.map(d => d.id)
  const progressByDayId = new Map<string, boolean>()
  if (dayIds.length > 0) {
    const { data: progressRows } = await supabase
      .from('user_progress')
      .select('day_id, is_completed')
      .eq('user_id', user.id)
      .in('day_id', dayIds)
    for (const row of progressRows || []) {
      progressByDayId.set(row.day_id, row.is_completed)
    }
  }

  const hasMore = days.length > pageSize
  const daysWithProgress: PlanDay[] = days.slice(0, pageSize).map(d => ({
    ...d,
    user_progress: progressByDayId.has(d.id) ? [{ is_completed: progressByDayId.get(d.id)! }] : [],
  }))
  return { days: daysWithProgress, hasMore }
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
