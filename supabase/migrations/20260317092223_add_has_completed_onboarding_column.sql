-- ============================================================
-- ADD HAS_COMPLETED_ONBOARDING COLUMN TO USERS TABLE
-- ============================================================

-- 1. Add the has_completed_onboarding column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- 2. Create an index to optimize future queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(has_completed_onboarding);

-- 3. Heuristic Backfill: Identify legacy users who have already filled their profile
-- We check for data that wasn't part of the initial signup form
UPDATE public.user_profiles
SET has_completed_onboarding = TRUE
WHERE 
  bio IS NOT NULL OR 
  linkedin_url IS NOT NULL OR 
  facebook_url IS NOT NULL OR 
  twitter_url IS NOT NULL OR 
  website_url IS NOT NULL OR 
  (skills IS NOT NULL AND array_length(skills, 1) > 0) OR
  (interests IS NOT NULL AND array_length(interests, 1) > 0);

-- 4. Synchronize Auth Metadata for legacy users
-- This allows the Middleware to detect their status immediately via the JWT
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"has_completed_onboarding": true}'::jsonb
WHERE id IN (
  SELECT user_id 
  FROM public.user_profiles 
  WHERE has_completed_onboarding = TRUE
);

-- 5. Ensure all other users are explicitly marked as false in metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"has_completed_onboarding": false}'::jsonb
WHERE (raw_user_meta_data->>'has_completed_onboarding') IS NULL;
