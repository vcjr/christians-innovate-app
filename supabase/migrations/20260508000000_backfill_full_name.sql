-- ============================================
-- Backfill full_name for user_profiles rows
-- where full_name is NULL due to the onboarding
-- upsert overwriting the handle_new_user value.
--
-- Pulls the name from auth.users.raw_user_meta_data
-- which is always set at signup and never erased.
-- ============================================
UPDATE public.user_profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.user_id = u.id
  AND p.full_name IS NULL
  AND (u.raw_user_meta_data->>'full_name') IS NOT NULL
  AND trim(u.raw_user_meta_data->>'full_name') <> '';
