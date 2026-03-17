-- Fix the is_admin function with correct parameter reference.
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- USE 'user_id' directly, not 'is_admin.user_id'.
    RETURN EXISTS(
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = user_id
            AND ur.is_admin = true
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Fail closed - return false on any error.
        RETURN false;
END;
$$;

-- Allow authenticated users to call this function.
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
