-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT,
  app_slug    TEXT,
  type        TEXT NOT NULL DEFAULT 'bug',
  subject     TEXT,
  body        TEXT NOT NULL,
  screenshot  TEXT,
  user_agent  TEXT,
  status      TEXT DEFAULT 'new',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit feedback
CREATE POLICY "Authenticated users can submit feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for admin querying
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_app ON public.feedback(app_slug, created_at DESC);

-- Grant permissions
GRANT INSERT, SELECT ON public.feedback TO authenticated;
