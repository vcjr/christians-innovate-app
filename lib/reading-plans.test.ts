import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureDefaultPlanSubscription } from './reading-plans'

type QueryResult = { data: unknown; error: unknown }

/**
 * Builds a minimal chainable Supabase mock. `planResults` are returned in order for each
 * reading_plans query; `upsertResult` is returned for the plan_subscriptions upsert.
 */
function createMockSupabase(planResults: QueryResult[], upsertResult: QueryResult = { data: null, error: null }) {
  const upsert = jest.fn().mockResolvedValue(upsertResult)
  const planQueries: Record<string, jest.Mock>[] = []

  const from = jest.fn((table: string) => {
    if (table === 'plan_subscriptions') {
      return { upsert }
    }
    const result = planResults[planQueries.length]
    const query: Record<string, jest.Mock> = {}
    query.select = jest.fn(() => query)
    query.eq = jest.fn(() => query)
    query.order = jest.fn(() => query)
    query.limit = jest.fn(() => query)
    query.maybeSingle = jest.fn().mockResolvedValue(result)
    planQueries.push(query)
    return query
  })

  return { supabase: { from } as unknown as SupabaseClient, from, upsert, planQueries }
}

describe('ensureDefaultPlanSubscription', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('subscribes the user to the default plan', async () => {
    const { supabase, upsert, planQueries } = createMockSupabase([{ data: { id: 'default-plan' }, error: null }])

    const result = await ensureDefaultPlanSubscription(supabase, 'user-1')

    expect(result).toBe('default-plan')
    expect(planQueries[0].eq).toHaveBeenCalledWith('is_default', true)
    expect(planQueries).toHaveLength(1)
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', plan_id: 'default-plan' },
      { onConflict: 'user_id,plan_id', ignoreDuplicates: true }
    )
  })

  it('falls back to the most recent plan when no default plan is set', async () => {
    const { supabase, upsert, planQueries } = createMockSupabase([
      { data: null, error: null },
      { data: { id: 'latest-plan' }, error: null },
    ])

    const result = await ensureDefaultPlanSubscription(supabase, 'user-1')

    expect(result).toBe('latest-plan')
    expect(planQueries[1].order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', plan_id: 'latest-plan' },
      expect.anything()
    )
  })

  it('returns null when no reading plans exist', async () => {
    const { supabase, upsert } = createMockSupabase([
      { data: null, error: null },
      { data: null, error: null },
    ])

    expect(await ensureDefaultPlanSubscription(supabase, 'user-1')).toBeNull()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('returns null when fetching the default plan fails', async () => {
    const { supabase, upsert } = createMockSupabase([{ data: null, error: { message: 'boom' } }])

    expect(await ensureDefaultPlanSubscription(supabase, 'user-1')).toBeNull()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('returns null when the subscription insert fails', async () => {
    const { supabase } = createMockSupabase(
      [{ data: { id: 'default-plan' }, error: null }],
      { data: null, error: { message: 'rls violation' } }
    )

    expect(await ensureDefaultPlanSubscription(supabase, 'user-1')).toBeNull()
  })
})
