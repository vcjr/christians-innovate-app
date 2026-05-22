-- ============================================
-- Add 'new_message' to the notifications type CHECK constraint
-- so messaging can create notifications for unread DMs.
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
      'join_request_rejected',
      'new_message'
    )
  );

-- ============================================
-- SECURITY DEFINER function for deduped message notifications.
-- Deletes any existing unread new_message notification for the
-- same conversation (reference_id), then inserts a fresh one.
-- This bypasses RLS so the sender can manage the recipient's
-- notification in a single atomic call.
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_message_notification(
  p_user_id      UUID,
  p_title        TEXT,
  p_message      TEXT,
  p_link         TEXT,
  p_reference_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove previous unread notification for this conversation
  DELETE FROM public.notifications
  WHERE user_id = p_user_id
    AND type = 'new_message'
    AND reference_id = p_reference_id
    AND is_read = false;

  -- Insert fresh notification
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  VALUES (p_user_id, 'new_message', p_title, p_message, p_link, p_reference_id);
END;
$$;

-- ============================================
-- SECURITY DEFINER function to dismiss message notifications
-- when a user reads the conversation. This lets the server
-- action clean up notifications for the current user even
-- though the delete goes through a privileged function.
-- ============================================
CREATE OR REPLACE FUNCTION public.dismiss_message_notifications(
  p_conversation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.notifications
  WHERE user_id = auth.uid()
    AND type = 'new_message'
    AND reference_id = p_conversation_id;
END;
$$;
