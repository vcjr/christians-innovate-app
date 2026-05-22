-- ============================================================
-- Tighten conversations RLS
--
-- Gap 1 (INSERT): the existing policy allowed any participant
-- to insert a conversation with an arbitrary requested_by,
-- enabling a requester to forge the direction of a request and
-- then self-accept it. Fix: require requested_by = auth.uid()
-- when status = 'pending'.
--
-- Gap 2 (UPDATE): the existing policy had no WITH CHECK, so any
-- participant could flip status directly (e.g. from pending to
-- accepted), bypassing the accept_message_request SECURITY
-- DEFINER function. Fix: restrict direct UPDATE to rows that
-- are already 'accepted' (old row check via USING) and stay
-- 'accepted' (new row check via WITH CHECK). Status transitions
-- for pending conversations go exclusively through SECURITY
-- DEFINER functions, which bypass RLS.
-- ============================================================

-- Fix gap 1: constrain requested_by on INSERT
DROP POLICY IF EXISTS "Create conversations" ON public.conversations;
CREATE POLICY "Create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND (
      status = 'accepted'
      OR (status = 'pending' AND requested_by = auth.uid())
    )
  );

-- Fix gap 2: restrict direct UPDATE to accepted conversations only
-- (pending→accepted transition must go through accept_message_request RPC)
DROP POLICY IF EXISTS "Update own conversations" ON public.conversations;
CREATE POLICY "Update own conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND status = 'accepted'
  )
  WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND status = 'accepted'
  );
