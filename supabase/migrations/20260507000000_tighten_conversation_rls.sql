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

-- Fix gap 1: constrain requested_by on INSERT and disallow inserting accepted conversations
DROP POLICY IF EXISTS "Create conversations" ON public.conversations;
CREATE POLICY "Create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND status = 'pending'
    AND requested_by = auth.uid()
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

-- Prevent direct mutation of identity columns (participant_1, participant_2, requested_by)
-- even on accepted conversations. Status transitions go through SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.prevent_conversation_identity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.participant_1 <> OLD.participant_1 OR
     NEW.participant_2 <> OLD.participant_2 OR
     NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
    RAISE EXCEPTION 'Cannot modify participant or requester identity of a conversation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_conversation_identity_immutability ON public.conversations;
CREATE TRIGGER enforce_conversation_identity_immutability
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_conversation_identity_change();
