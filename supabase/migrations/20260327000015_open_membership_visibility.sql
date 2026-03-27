-- Allow any authenticated user to read group memberships.
-- Needed so the Discover Groups page can show member counts and
-- avatar previews for groups the viewer hasn't joined yet.
-- INSERT / UPDATE / DELETE policies are unchanged — users can still
-- only add/remove their own membership rows.

DROP POLICY IF EXISTS "View group memberships" ON public.user_group_memberships;

CREATE POLICY "View group memberships" ON public.user_group_memberships
FOR SELECT USING (auth.uid() IS NOT NULL);
