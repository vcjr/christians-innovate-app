-- Migration to add email system tables and preferences
-- This migration is idempotent and safe to run multiple times

-- Add email notification preferences to user_profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'daily_reminder_enabled'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN daily_reminder_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'meeting_reminder_enabled'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN meeting_reminder_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'weekly_digest_enabled'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN weekly_digest_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN public.user_profiles.email_notifications_enabled IS 'Master toggle for all email notifications';
COMMENT ON COLUMN public.user_profiles.daily_reminder_enabled IS 'Toggle for daily reading plan reminder emails';
COMMENT ON COLUMN public.user_profiles.meeting_reminder_enabled IS 'Toggle for meeting reminder emails';
COMMENT ON COLUMN public.user_profiles.weekly_digest_enabled IS 'Toggle for weekly digest emails';

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to document the table
COMMENT ON TABLE public.email_templates IS 'Stores email templates with WYSIWYG-edited HTML content';
COMMENT ON COLUMN public.email_templates.template_key IS 'Unique identifier for the template (e.g., "daily-reminder", "welcome")';
COMMENT ON COLUMN public.email_templates.name IS 'Human-readable name for the template';
COMMENT ON COLUMN public.email_templates.variables IS 'Array of available variables for this template (e.g., ["user.name", "day.scripture"])';
COMMENT ON COLUMN public.email_templates.body_html IS 'HTML content of the email';
COMMENT ON COLUMN public.email_templates.body_text IS 'Plain text fallback for the email';

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template_key TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  resend_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to document the table
COMMENT ON TABLE public.email_logs IS 'Tracks all emails sent through the system for debugging and analytics';
COMMENT ON COLUMN public.email_logs.resend_id IS 'The message ID returned by Resend API';
COMMENT ON COLUMN public.email_logs.metadata IS 'Additional context (plan_id, day_id, meeting_id, etc.)';
COMMENT ON COLUMN public.email_logs.status IS 'Status of the email: sent, failed, or pending';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
-- (Assumes this function already exists from previous migrations)
-- If not, create it:
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT ur.is_admin INTO is_admin_user
  FROM public.user_roles ur
  WHERE ur.user_id = $1;
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for email_templates

-- Anyone can view active templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.email_templates;
CREATE POLICY "Anyone can view active templates" ON public.email_templates 
  FOR SELECT 
  USING (is_active = true OR public.is_admin(auth.uid()));

-- Only admins can insert templates
DROP POLICY IF EXISTS "Only admins can insert templates" ON public.email_templates;
CREATE POLICY "Only admins can insert templates" ON public.email_templates 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update templates
DROP POLICY IF EXISTS "Only admins can update templates" ON public.email_templates;
CREATE POLICY "Only admins can update templates" ON public.email_templates 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

-- Only admins can delete templates
DROP POLICY IF EXISTS "Only admins can delete templates" ON public.email_templates;
CREATE POLICY "Only admins can delete templates" ON public.email_templates 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- RLS Policies for email_logs

-- Users can view their own email logs
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs" ON public.email_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- System can insert email logs (server actions authenticated as service role)
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
CREATE POLICY "System can insert email logs" ON public.email_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Only admins can update email logs
DROP POLICY IF EXISTS "Only admins can update email logs" ON public.email_logs;
CREATE POLICY "Only admins can update email logs" ON public.email_logs 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

-- Create updated_at trigger for email_templates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
