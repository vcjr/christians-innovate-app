-- ============================================
-- Multi-group support + security & bug fixes
-- ============================================

-- 1. Create junction table for many-to-many user <-> group membership
CREATE TABLE public.user_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.accountability_groups(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, group_id)
);

-- 2. Migrate existing single-group memberships from user_profiles
INSERT INTO public.user_group_memberships (user_id, group_id)
SELECT user_id, accountability_group_id
FROM public.user_profiles
WHERE accountability_group_id IS NOT NULL;

-- 3. Drop the now-redundant single-group column
ALTER TABLE public.user_profiles DROP COLUMN accountability_group_id;

-- 4. Fix: status NOT NULL on group_commitments (CHECK constraint doesn't reject NULL in Postgres)
ALTER TABLE public.group_commitments ALTER COLUMN status SET NOT NULL;

-- 5. Create helper functions BEFORE any policies that reference them

-- Returns all group IDs the calling user belongs to.
-- SECURITY DEFINER + explicit search_path prevent search_path hijacking.
CREATE OR REPLACE FUNCTION public.get_user_groups()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY(
    SELECT group_id FROM public.user_group_memberships WHERE user_id = auth.uid()
  );
$$;

-- Backward-compat single-group variant; rebuilt here to fix missing search_path.
CREATE OR REPLACE FUNCTION public.get_user_group()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT group_id FROM public.user_group_memberships WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 6. Enable RLS on junction table and create its policies
--    (get_user_groups() is now defined above so the SELECT policy can reference it)
ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;

-- Members can see all memberships for groups they belong to
CREATE POLICY "View group memberships" ON public.user_group_memberships
FOR SELECT USING (
  user_id = auth.uid()
  OR group_id = ANY(public.get_user_groups())
);

-- Users can add themselves (createGroup action runs as the authenticated user)
CREATE POLICY "Insert own membership" ON public.user_group_memberships
FOR INSERT WITH CHECK (user_id = auth.uid());

-- User can remove own membership; group creator can remove other members
CREATE POLICY "Delete membership" ON public.user_group_memberships
FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.accountability_groups
    WHERE id = group_id AND created_by = auth.uid()
  )
);

-- 7. Fix group_commitments policies: split FOR ALL so members can't mutate others' rows
DROP POLICY IF EXISTS "Manage group commitments" ON public.group_commitments;

CREATE POLICY "Select group commitments" ON public.group_commitments
FOR SELECT USING (group_id = ANY(public.get_user_groups()));

CREATE POLICY "Insert group commitments" ON public.group_commitments
FOR INSERT WITH CHECK (
  group_id = ANY(public.get_user_groups())
  AND user_id = auth.uid()
);

CREATE POLICY "Update own group commitments" ON public.group_commitments
FOR UPDATE USING (
  group_id = ANY(public.get_user_groups())
  AND auth.uid() = user_id
);

CREATE POLICY "Delete own group commitments" ON public.group_commitments
FOR DELETE USING (
  group_id = ANY(public.get_user_groups())
  AND auth.uid() = user_id
);

-- 8. Fix debrief_sessions policies: split FOR ALL so members can't edit others' sessions
DROP POLICY IF EXISTS "Manage group debriefs" ON public.debrief_sessions;

CREATE POLICY "View group debriefs" ON public.debrief_sessions
FOR SELECT USING (group_id = ANY(public.get_user_groups()));

CREATE POLICY "Create own debriefs" ON public.debrief_sessions
FOR INSERT WITH CHECK (
  group_id = ANY(public.get_user_groups())
  AND facilitator_id = auth.uid()
);

CREATE POLICY "Update own debriefs" ON public.debrief_sessions
FOR UPDATE USING (
  group_id = ANY(public.get_user_groups())
  AND facilitator_id = auth.uid()
);

CREATE POLICY "Delete own debriefs" ON public.debrief_sessions
FOR DELETE USING (
  group_id = ANY(public.get_user_groups())
  AND facilitator_id = auth.uid()
);

-- 9. Update "View own group" policy on accountability_groups to use the junction table
DROP POLICY IF EXISTS "View own group" ON public.accountability_groups;

CREATE POLICY "View own group" ON public.accountability_groups
FOR SELECT USING (
  id = ANY(public.get_user_groups())
  OR created_by = auth.uid()
  OR id IN (
    SELECT group_id FROM public.group_invitations
    WHERE invited_user_id = auth.uid() AND status = 'pending'
  )
);

-- 10. Fix invitation UPDATE policy: remove inviter from the UPDATE clause
--     (inviter can re-invite via DELETE+INSERT; they should not be able to spoof accept/decline)
DROP POLICY IF EXISTS "Invited user can respond" ON public.group_invitations;

CREATE POLICY "Invited user can respond" ON public.group_invitations
FOR UPDATE USING (auth.uid() = invited_user_id);

-- 11. Rebuild accept_group_invitation with:
--     - explicit SET search_path (security hardening)
--     - row-affected verification after INSERT
--     - multi-group support (junction table instead of user_profiles column)
DROP FUNCTION IF EXISTS public.accept_group_invitation(UUID);

CREATE OR REPLACE FUNCTION public.accept_group_invitation(invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inv RECORD;
  rows_affected INTEGER;
BEGIN
  SELECT * INTO inv
  FROM public.group_invitations
  WHERE id = invitation_id AND status = 'pending';

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already responded to';
  END IF;

  IF inv.invited_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You are not the invited user';
  END IF;

  -- Allow joining multiple groups; only block if already in this specific group
  IF EXISTS (
    SELECT 1 FROM public.user_group_memberships
    WHERE user_id = auth.uid() AND group_id = inv.group_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this accountability group';
  END IF;

  -- Add user to the group via junction table
  INSERT INTO public.user_group_memberships (user_id, group_id)
  VALUES (auth.uid(), inv.group_id);

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Failed to join group — no membership row was created';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.group_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = invitation_id;

  -- Mark the notification as read
  UPDATE public.notifications
  SET is_read = true
  WHERE reference_id = invitation_id AND user_id = auth.uid();
END;
$$;
