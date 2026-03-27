-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('group_invitation', 'general')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,                          -- e.g. '/accountability'
  reference_id UUID,                  -- e.g. the invitation id
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- GROUP INVITATIONS TABLE
-- ============================================
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.accountability_groups(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, invited_user_id)   -- prevent duplicate invitations to same group
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Notifications: users can only read/update/delete their own
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Notifications: any authenticated user can create notifications (for others, e.g. invitations)
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Group invitations: invited user can see their invitations
CREATE POLICY "Invited user can view invitations" ON public.group_invitations
FOR SELECT USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

-- Group invitations: group creator can create invitations
CREATE POLICY "Group creator can invite" ON public.group_invitations
FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- Group invitations: invited user can update (accept/decline), inviter can re-invite
CREATE POLICY "Invited user can respond" ON public.group_invitations
FOR UPDATE USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

-- Group invitations: inviter can delete their sent invitations (for re-inviting)
CREATE POLICY "Inviter can delete invitations" ON public.group_invitations
FOR DELETE USING (auth.uid() = invited_by);

-- ============================================
-- SECURITY DEFINER function for accepting invitations
-- Bypasses user_profiles RLS to set accountability_group_id
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_group_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
  current_group UUID;
BEGIN
  -- Get the invitation
  SELECT * INTO inv
  FROM public.group_invitations
  WHERE id = invitation_id AND status = 'pending';

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already responded to';
  END IF;

  -- Verify the caller is the invited user
  IF inv.invited_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You are not the invited user';
  END IF;

  -- Check the user is not already in a group
  SELECT accountability_group_id INTO current_group
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF current_group IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in an accountability group';
  END IF;

  -- Add user to the group
  UPDATE public.user_profiles
  SET accountability_group_id = inv.group_id
  WHERE user_id = auth.uid();

  -- Mark invitation as accepted
  UPDATE public.group_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = invitation_id;

  -- Mark the notification as read
  UPDATE public.notifications
  SET is_read = true
  WHERE reference_id = invitation_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update accountability_groups SELECT policy
-- Allow invited users to view the group they were invited to
-- ============================================
DROP POLICY IF EXISTS "View own group" ON public.accountability_groups;

CREATE POLICY "View own group" ON public.accountability_groups
FOR SELECT USING (
  id = public.get_user_group()
  OR created_by = auth.uid()
  OR id IN (
    SELECT group_id FROM public.group_invitations
    WHERE invited_user_id = auth.uid() AND status = 'pending'
  )
);
