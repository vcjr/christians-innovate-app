-- Rollback the problematic is_admin function that caused admin access issues
-- This restores admin panel access while keeping auto-subscription functionality intact
-- We need to keep the function since RLS policies depend on it, but we'll revert to direct queries in the app

-- Revert the is_admin function to the original version that worked before our changes
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND is_admin = true
  );
END;
$$;

-- Keep the grant for RLS policies to use
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;