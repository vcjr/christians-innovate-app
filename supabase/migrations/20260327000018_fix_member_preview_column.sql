-- ============================================
-- Fix get_groups_member_preview: column is `joined_at`, not `created_at`
-- The original function referenced ugm.created_at which doesn't exist on
-- user_group_memberships, causing a silent RPC error and 0-member counts.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_groups_member_preview(p_group_ids UUID[])
RETURNS TABLE (
  group_id    UUID,
  member_count INTEGER,
  preview_names TEXT[],
  preview_avatars TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    base.group_id,
    COUNT(base.user_id)::INTEGER AS member_count,
    ARRAY_AGG(base.full_name ORDER BY base.joined_at) FILTER (WHERE base.rn <= 4) AS preview_names,
    ARRAY_AGG(base.avatar_url ORDER BY base.joined_at) FILTER (WHERE base.rn <= 4) AS preview_avatars
  FROM (
    SELECT
      ugm.group_id,
      ugm.user_id,
      ugm.joined_at,
      up.full_name,
      up.avatar_url,
      ROW_NUMBER() OVER (PARTITION BY ugm.group_id ORDER BY ugm.joined_at) AS rn
    FROM public.user_group_memberships ugm
    LEFT JOIN public.user_profiles up ON up.user_id = ugm.user_id
    WHERE ugm.group_id = ANY(p_group_ids)
  ) base
  GROUP BY base.group_id;
END;
$$;
