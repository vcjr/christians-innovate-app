'use server'

import { createClient } from '@/utils/supabase/server'

export type PlanStats = {
  id: string
  title: string
  description: string | null
  total_subscribers: number
  total_days: number
  active_readers: number // users who completed at least one day in last 7 days
  up_to_date_count: number // users who have completed all days up to today
  average_completion_rate: number // average % of days completed across all subscribers
}

export async function getPlanStatistics() {
  const supabase = await createClient()

  // Ensure the caller is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Unauthorized access to getPlanStatistics: no user', userError)
    return { error: 'Unauthorized' }
  }

  // Ensure the caller is an admin (matches pattern used in other admin actions)
  const {
    data: userRole,
    error: roleError,
  } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (roleError || !userRole?.is_admin) {
    console.error('Unauthorized access to getPlanStatistics: non-admin user', roleError)
    return { error: 'Forbidden' }
  }

  // Get all plans with subscriber counts and day counts
  const { data: plans, error: plansError } = await supabase
    .from('reading_plans')
    .select(`
      id,
      title,
      description,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('Error fetching plans:', plansError)
    return { error: plansError.message }
  }

  if (!plans || plans.length === 0) {
    return { data: [] }
  }

  // Get statistics for each plan
  const planStats: PlanStats[] = await Promise.all(
    plans.map(async (plan: { id: string; title: string; description: string | null; created_at: string }) => {
      // Get total subscribers
      const { count: subscriberCount } = await supabase
        .from('plan_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id)

      // Get total days in the plan
      const { count: daysCount } = await supabase
        .from('plan_days')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id)

      // Get the highest day number to determine "current" day
      const { data: maxDayData } = await supabase
        .from('plan_days')
        .select('day_number')
        .eq('plan_id', plan.id)
        .order('day_number', { ascending: false })
        .limit(1)
        .single()

      const totalDays = maxDayData?.day_number || daysCount || 0

      // Get active readers (completed at least one day in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Get all day IDs for this plan, and short-circuit if there are none
      const { data: planDayIdData } = await supabase
        .from('plan_days')
        .select('id')
        .eq('plan_id', plan.id)

      const dayIds = planDayIdData?.map((d: { id: string }) => d.id) || []

      let activeReaders = 0
      if (dayIds.length > 0) {
        const { data: activeReadersData } = await supabase
          .from('user_progress')
          .select('user_id')
          .gte('completed_at', sevenDaysAgo.toISOString())
          .in('day_id', dayIds)

        activeReaders = new Set(activeReadersData?.map((r: { user_id: string }) => r.user_id) || []).size
      }

      // Get users who are up to date
      // "Up to date" means they've completed all days up to the current day number
      // For simplicity, we'll check users who have completed all existing days
      const { data: subscribers } = await supabase
        .from('plan_subscriptions')
        .select('user_id')
        .eq('plan_id', plan.id)

      let upToDateCount = 0
      let totalCompletionRate = 0

      if (subscribers && subscribers.length > 0) {
        // Fetch all days for this plan once
        const { data: planDays } = await supabase
          .from('plan_days')
          .select('id')
          .eq('plan_id', plan.id)

        if (planDays && planDays.length > 0) {
          const planDayIds = planDays.map((d: { id: string }) => d.id)
          const subscriberIds = subscribers.map((s: { user_id: string }) => s.user_id)

          // Fetch all completed days for all subscribers on this plan in a single query
          const { data: progressRows } = await supabase
            .from('user_progress')
            .select('user_id, day_id')
            .in('user_id', subscriberIds)
            .in('day_id', planDayIds)

          // Aggregate completed day counts per user
          const completionByUser = new Map<string, number>()
          if (progressRows) {
            for (const row of progressRows) {
              const current = completionByUser.get(row.user_id) ?? 0
              completionByUser.set(row.user_id, current + 1)
            }
          }

          for (const subscriber of subscribers) {
            const completedCount = completionByUser.get(subscriber.user_id) ?? 0
            const completionRate =
              totalDays > 0 ? (completedCount / totalDays) * 100 : 0
            totalCompletionRate += completionRate

            // Consider "up to date" if they've completed at least 80% of days
            // or all available days
            if (completedCount >= planDayIds.length || completionRate >= 80) {
              upToDateCount++
            }
          }
        }
      }

      const averageCompletionRate =
        subscribers && subscribers.length > 0
          ? totalCompletionRate / subscribers.length
          : 0

      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        total_subscribers: subscriberCount || 0,
        total_days: totalDays,
        active_readers: activeReaders,
        up_to_date_count: upToDateCount,
        average_completion_rate: Math.round(averageCompletionRate),
      }
    })
  )

  return { data: planStats }
}

export async function getOverallStats() {
  const supabase = await createClient()

  // Authorization: Only allow authenticated admin users to access overall stats
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authorized' }
  }

  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (roleError || !userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  // Get total number of unique subscribers across all plans
  const { data: allSubscribers, error: subscribersError } = await supabase
    .from('plan_subscriptions')
    .select('user_id')

  if (subscribersError) {
    return {
      totalUniqueSubscribers: 0,
      totalPlans: 0,
      recentCompletions: 0,
      error: subscribersError.message ?? 'Failed to fetch plan subscribers',
    }
  }

  const totalUniqueSubscribers = new Set(
    allSubscribers?.map((s: { user_id: string }) => s.user_id) || []
  ).size

  // Get total number of plans
  const { count: totalPlans, error: plansError } = await supabase
    .from('reading_plans')
    .select('*', { count: 'exact', head: true })

  if (plansError) {
    return {
      totalUniqueSubscribers,
      totalPlans: 0,
      recentCompletions: 0,
      error: plansError.message ?? 'Failed to fetch reading plans count',
    }
  }

  // Get total completions in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: recentCompletions, error: progressError } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .gte('completed_at', sevenDaysAgo.toISOString())

  if (progressError) {
    return {
      totalUniqueSubscribers,
      totalPlans: totalPlans || 0,
      recentCompletions: 0,
      error: progressError.message ?? 'Failed to fetch recent completions',
    }
  }

  return {
    totalUniqueSubscribers,
    totalPlans: totalPlans || 0,
    recentCompletions: recentCompletions || 0,
  }
}

export type SubscriberProgress = {
  user_id: string
  full_name: string
  avatar_url: string | null
  subscribed_at: string
  total_days: number
  completed_days: number
  completion_percentage: number
  last_activity: string | null
  current_day: number | null
}

export async function getPlanSubscribers(planId: string) {
  const supabase = await createClient()

  // Enforce authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Error fetching authenticated user or user not authenticated:', authError)
    return { error: 'Not authenticated' }
  }

  // Enforce admin role
  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (roleError) {
    console.error('Error fetching user role:', roleError)
    return { error: 'Authorization check failed' }
  }

  if (!role || !role.is_admin) {
    return { error: 'Forbidden' }
  }

  // Get all subscribers for this plan
  const { data: subscriptions, error: subsError } = await supabase
    .from('plan_subscriptions')
    .select('user_id, subscribed_at')
    .eq('plan_id', planId)

  if (subsError) {
    console.error('Error fetching subscriptions:', subsError)
    return { error: subsError.message }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { data: [] }
  }

  // Get total days in the plan
  const { data: planDays } = await supabase
    .from('plan_days')
    .select('id, day_number')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true })

  const totalDays = planDays?.length || 0
  const planDayIds = planDays?.map((d: { id: string }) => d.id) || []

  // Collect all user IDs for batching
  const userIds = subscriptions.map((subscription: { user_id: string }) => subscription.user_id)

  // Batch fetch user profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', userIds)

  const profileByUserId = new Map<string, { user_id: string; full_name: string | null; avatar_url: string | null }>()
  for (const profile of profiles || []) {
    profileByUserId.set(profile.user_id, profile)
  }

  // Batch fetch all progress records for these users and this plan's days
  let progressByUserId = new Map<string, { user_id: string; day_id: string; completed_at: string | null }[]>()
  
  if (planDayIds.length > 0) {
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('user_id, day_id, completed_at')
      .in('user_id', userIds)
      .in('day_id', planDayIds)
      .order('completed_at', { ascending: false })

    for (const row of allProgress || []) {
      const list = progressByUserId.get(row.user_id) || []
      list.push(row)
      progressByUserId.set(row.user_id, list)
    }
  }

  // Build subscriber progress from batched data
  const subscriberProgress: SubscriberProgress[] = subscriptions.map((subscription: { user_id: string; subscribed_at: string }) => {
    const profile = profileByUserId.get(subscription.user_id)
    const completedDays = progressByUserId.get(subscription.user_id) || []

    const completedCount = completedDays.length
    const completionPercentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0
    const lastActivity = completedDays[0]?.completed_at || null

    // Find current day (next incomplete day)
    const completedDayIds = new Set(completedDays.map((d: { day_id: string }) => d.day_id))
    const nextIncompleteDay = planDays?.find((day: { id: string; day_number: number }) => !completedDayIds.has(day.id))

    return {
      user_id: subscription.user_id,
      full_name: profile?.full_name || 'Unknown User',
      avatar_url: profile?.avatar_url || null,
      subscribed_at: subscription.subscribed_at,
      total_days: totalDays,
      completed_days: completedCount,
      completion_percentage: completionPercentage,
      last_activity: lastActivity,
      current_day: nextIncompleteDay?.day_number || null,
    }
  })

  // Sort by completion percentage descending
  subscriberProgress.sort((a, b) => b.completion_percentage - a.completion_percentage)

  return { data: subscriberProgress }
}
