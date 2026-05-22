-- ============================================================
-- In-App Messaging Feature
-- ============================================================

-- 1. Conversations table (one row per unique pair of participants)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Ensure uniqueness: store the smaller UUID first to avoid duplicates
  CONSTRAINT conversations_unique_participants UNIQUE (participant_1, participant_2),
  CONSTRAINT conversations_no_self_chat CHECK (participant_1 <> participant_2),
  -- Enforce canonical ordering so (A,B) and (B,A) cannot both exist
  CONSTRAINT conversations_participant_order_check CHECK (participant_1 < participant_2)
);

-- 2. Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 4000),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast conversation lookups
CREATE INDEX messages_conversation_id_idx ON public.messages (conversation_id, created_at ASC);
CREATE INDEX conversations_participant_1_idx ON public.conversations (participant_1);
CREATE INDEX conversations_participant_2_idx ON public.conversations (participant_2);

-- 3. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Conversations

-- Users can view conversations they are part of
CREATE POLICY "View own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Users can create a conversation only if they are one of the participants
CREATE POLICY "Create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Allow updating last_message_at for participants
CREATE POLICY "Update own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- 5. RLS Policies: Messages

-- Users can view messages in conversations they belong to
CREATE POLICY "View messages in own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Users can send messages to their own conversations
CREATE POLICY "Send messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Users can mark messages as read (update is_read) in their conversations
CREATE POLICY "Mark messages as read" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- 6. Enable Realtime for live message updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
