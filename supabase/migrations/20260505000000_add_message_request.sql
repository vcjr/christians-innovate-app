-- ============================================================
-- Add message-request flow to conversations
-- ============================================================

-- 1. New columns on conversations
ALTER TABLE public.conversations
  ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted')),
  ADD COLUMN requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- All existing conversations are already 'accepted' (default covers them).

-- 2. Add 'message_request' to the notifications type constraint
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
      'join_request_rejected',
      'new_message',
      'message_request'
    )
  );

-- 3. Tighten the messages INSERT RLS policy to block writes on pending conversations
DROP POLICY IF EXISTS "Send messages in own conversations" ON public.messages;
CREATE POLICY "Send messages in own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        AND c.status = 'accepted'
    )
  );

-- 4. SECURITY DEFINER: accept a pending message request
--    Caller must be the non-requester participant.
--    Sets status = 'accepted' and notifies the requester.
CREATE OR REPLACE FUNCTION public.accept_message_request(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_requester_id UUID;
  v_accepter_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find the conversation: caller must be a participant but NOT the requester
  SELECT requested_by INTO v_requester_id
  FROM public.conversations
  WHERE id = p_conversation_id
    AND status = 'pending'
    AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    AND requested_by IS DISTINCT FROM auth.uid();

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found, not pending, or caller is the requester';
  END IF;

  -- Accept
  UPDATE public.conversations
  SET status = 'accepted'
  WHERE id = p_conversation_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation is no longer pending';
  END IF;

  -- Look up accepter's name for the notification
  SELECT full_name INTO v_accepter_name
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  -- Notify the original requester
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  VALUES (
    v_requester_id,
    'message_request',
    COALESCE(v_accepter_name, 'Someone') || ' accepted your message request',
    'You can now start chatting!',
    '/messages/' || p_conversation_id::text,
    p_conversation_id
  );
END;
$$;

-- 5. SECURITY DEFINER: decline a pending message request
--    Caller must be a participant (either side can decline/cancel).
--    Deletes the conversation (cascades to messages).
--    No notification is sent to the requester on decline (by design — avoids awkwardness).
CREATE OR REPLACE FUNCTION public.decline_message_request(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
      AND status = 'pending'
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Conversation not found or not pending';
  END IF;

  DELETE FROM public.conversations WHERE id = p_conversation_id;
END;
$$;
