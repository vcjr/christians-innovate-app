-- 1. Join requests table
CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.accountability_groups(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, requester_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- Requester sees their own; creator sees requests for their groups
CREATE POLICY "View join requests" ON public.group_join_requests
FOR SELECT USING (
  requester_id = auth.uid()
  OR group_id IN (
    SELECT id FROM public.accountability_groups WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Insert own join request" ON public.group_join_requests
FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Only creator can approve/reject
CREATE POLICY "Update join request" ON public.group_join_requests
FOR UPDATE USING (
  group_id IN (
    SELECT id FROM public.accountability_groups WHERE created_by = auth.uid()
  )
);

-- Requester can cancel their own request
CREATE POLICY "Delete join request" ON public.group_join_requests
FOR DELETE USING (requester_id = auth.uid());

-- 2. SECURITY DEFINER function so creator can add the requester to user_group_memberships
--    (Normal RLS on user_group_memberships only allows user_id = auth.uid() inserts)
CREATE OR REPLACE FUNCTION public.approve_join_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req
  FROM public.group_join_requests
  WHERE id = request_id AND status = 'pending';

  IF req IS NULL THEN
    RAISE EXCEPTION 'Join request not found or already responded to';
  END IF;

  -- Verify caller is the group creator
  IF NOT EXISTS (
    SELECT 1 FROM public.accountability_groups
    WHERE id = req.group_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the group creator can approve join requests';
  END IF;

  -- Add requester to group (ignore if already member)
  INSERT INTO public.user_group_memberships (user_id, group_id)
  VALUES (req.requester_id, req.group_id)
  ON CONFLICT (user_id, group_id) DO NOTHING;

  -- Mark request approved
  UPDATE public.group_join_requests
  SET status = 'approved', responded_at = now()
  WHERE id = request_id;
END;
$$;

-- 3. Allow all authenticated users to browse groups (needed for discover page)
DROP POLICY IF EXISTS "View own group" ON public.accountability_groups;

CREATE POLICY "View groups" ON public.accountability_groups
FOR SELECT USING (auth.uid() IS NOT NULL);
