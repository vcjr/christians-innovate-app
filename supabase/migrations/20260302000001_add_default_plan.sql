-- ────────────────────────────────────────────────────────────────────────────
-- Default Reading Plan
--
-- Adds an is_default flag to reading_plans so admins can designate one plan
-- as the app-wide default. New members are auto-subscribed to it via the
-- handle_new_user trigger. Existing members without a subscription are
-- handled in the dashboard at page-load time.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reading_plans
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reading_plans.is_default IS
  'When true this plan is automatically assigned to every new member on signup';

-- Enforce at most one default plan
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_plans_single_default
  ON public.reading_plans (is_default)
  WHERE is_default = true;

-- ── Update handle_new_user to auto-subscribe to the default plan ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create the user profile
  INSERT INTO user_profiles (user_id, email, full_name, ci_updates, bible_year, skill_share, referral)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'ci_updates')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'bible_year')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'skill_share')::boolean, false),
    NEW.raw_user_meta_data->>'referral'
  );

  -- Auto-subscribe to the default reading plan (if one is set)
  INSERT INTO plan_subscriptions (user_id, plan_id)
  SELECT NEW.id, id
  FROM reading_plans
  WHERE is_default = true
  LIMIT 1
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
