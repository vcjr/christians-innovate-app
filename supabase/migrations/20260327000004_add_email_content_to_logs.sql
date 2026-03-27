-- Migration to add email content to logs for viewing sent emails
-- This allows us to display the actual email that was sent to users

-- Add body_html and body_text columns to email_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'email_logs' 
      AND column_name = 'body_html'
  ) THEN
    ALTER TABLE public.email_logs 
    ADD COLUMN body_html TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'email_logs' 
      AND column_name = 'body_text'
  ) THEN
    ALTER TABLE public.email_logs 
    ADD COLUMN body_text TEXT;
  END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN public.email_logs.body_html IS 'Full HTML content of the sent email (for viewing what was actually sent)';
COMMENT ON COLUMN public.email_logs.body_text IS 'Plain text content of the sent email';
