import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * @function ensureDefaultPlanSubscription
 * @description Subscribes a user who opted into `bible_year` to the default reading plan.
 * The signup trigger only runs once (on auth.users insert) and silently skips enrollment when
 * no default plan exists at that moment, so this runs after login to self-heal missed enrollments.
 * Falls back to the most recently created plan when no plan is flagged as default.
 * @returns The subscribed plan id, or null if no subscription was created.
 */
export async function ensureDefaultPlanSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: defaultPlan, error: defaultPlanError } = await supabase
    .from('reading_plans')
    .select('id')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (defaultPlanError) {
    console.error('Failed to fetch default reading plan:', defaultPlanError)
    return null
  }

  let planId: string | null = defaultPlan?.id ?? null

  if (!planId) {
    const { data: latestPlan, error: latestPlanError } = await supabase
      .from('reading_plans')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestPlanError) {
      console.error('Failed to fetch fallback reading plan:', latestPlanError)
      return null
    }

    planId = latestPlan?.id ?? null
    if (!planId) {
      console.warn(`User ${userId} opted into bible_year but no reading plans exist`)
      return null
    }
    console.warn(`No default reading plan set; auto-subscribing user ${userId} to latest plan ${planId}`)
  }

  const { error: subscribeError } = await supabase
    .from('plan_subscriptions')
    .upsert(
      { user_id: userId, plan_id: planId },
      { onConflict: 'user_id,plan_id', ignoreDuplicates: true }
    )

  if (subscribeError) {
    console.error('Failed to auto-subscribe user to reading plan:', subscribeError)
    return null
  }

  return planId
}
