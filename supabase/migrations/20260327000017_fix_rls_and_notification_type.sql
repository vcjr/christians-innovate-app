-- ============================================
-- 1. Expand notifications.type CHECK constraint to cover all used types.
--    The original constraint only allowed 'group_invitation' and 'general',
--    which caused constraint violations for the new notification types.
-- ============================================
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'group_invitation',
      'general',
      'member_left',
      'member_removed',
      'ownership_transferred',
      'invitation_accepted',
      'invitation_declined',
      'rhythm_updated',
      'join_request',
      'join_request_approved',
      'join_request_rejected'
    )
  );

-- ============================================
-- 2. SECURITY DEFINER function for cross-user notifications.
--    Server actions call this instead of inserting directly, so ordinary
--    users cannot spam arbitrary notifications via the REST API.
-- ============================================
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id    UUID,
  p_type       TEXT,
  p_title      TEXT,
  p_message    TEXT    DEFAULT NULL,
  p_link       TEXT    DEFAULT NULL,
  p_reference_id UUID  DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Require an authenticated caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_reference_id);
END;
$$;

-- ============================================
-- 3. Restrict notifications INSERT policy: users may only insert
--    notifications for themselves.  Cross-user notifications must go
--    through the create_notification_for_user() SECURITY DEFINER function.
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Add WITH CHECK to the "Update join request" RLS policy so a group
--    creator cannot reassign requests to a different group.
-- ============================================
DROP POLICY IF EXISTS "Update join request" ON public.group_join_requests;

CREATE POLICY "Update join request" ON public.group_join_requests
FOR UPDATE
USING (
  group_id IN (
    SELECT id FROM public.accountability_groups WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  group_id IN (
    SELECT id FROM public.accountability_groups WHERE created_by = auth.uid()
  )
);

-- ============================================
-- 5. Replace the open "View group memberships" policy with a more
--    privacy-preserving one: users can see their own memberships, and
--    group creators can see the memberships for their groups.
--    The discover page obtains member counts/previews via a SECURITY DEFINER
--    function instead of direct table access.
-- ============================================
DROP POLICY IF EXISTS "View group memberships" ON public.user_group_memberships;

CREATE POLICY "View group memberships" ON public.user_group_memberships
FOR SELECT USING (
  user_id = auth.uid()
  OR group_id IN (
    SELECT id FROM public.accountability_groups WHERE created_by = auth.uid()
  )
);

-- ============================================
-- 6. SECURITY DEFINER helper that returns member count + limited preview
--    profiles (name, avatar) for a list of groups.  Used by the discover
--    page so it can show counts and avatars without exposing raw membership
--    rows to every authenticated user.
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
      ugm.created_at AS joined_at,
      up.full_name,
      up.avatar_url,
      ROW_NUMBER() OVER (PARTITION BY ugm.group_id ORDER BY ugm.created_at) AS rn
    FROM public.user_group_memberships ugm
    LEFT JOIN public.user_profiles up ON up.user_id = ugm.user_id
    WHERE ugm.group_id = ANY(p_group_ids)
  ) base
  GROUP BY base.group_id;
END;
$$;
