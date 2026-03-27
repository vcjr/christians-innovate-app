-- ============================================
-- Fix plan_subscriptions SELECT policy.
-- The original policy used USING (true), exposing every user's plan
-- subscriptions to any authenticated user. Restrict to own rows only.
-- ============================================
DROP POLICY IF EXISTS "Users can view all subscriptions" ON public.plan_subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.plan_subscriptions
FOR SELECT USING (auth.uid() = user_id);
