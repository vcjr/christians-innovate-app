-- ============================================================
-- RPC: get_unread_message_counts
-- Returns per-conversation unread message counts for the
-- calling user. Runs with the caller's role (SECURITY INVOKER)
-- so RLS on messages and conversations is enforced automatically.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_unread_message_counts()
RETURNS TABLE(conversation_id UUID, unread_count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT m.conversation_id, COUNT(*) AS unread_count
  FROM public.messages m
  INNER JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    AND m.is_read = false
    AND m.sender_id <> auth.uid()
  GROUP BY m.conversation_id;
$$;
