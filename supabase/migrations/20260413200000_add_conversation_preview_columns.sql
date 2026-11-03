-- ============================================
-- Add last_message_preview and last_message_sender_id to conversations
-- so the conversation list can be rendered without querying the messages table.
-- ============================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
  ADD COLUMN IF NOT EXISTS last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill existing conversations with the latest message data (preview truncated to 100 chars)
UPDATE public.conversations c
SET
  last_message_preview = CASE WHEN char_length(m.content) > 100 THEN left(m.content, 97) || '…' ELSE m.content END,
  last_message_sender_id = m.sender_id
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id, content, sender_id
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id;
