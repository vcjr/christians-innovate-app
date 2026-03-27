-- Migration to add scheduled jobs and admin inbox functionality
-- This allows admins to manage cron jobs dynamically and handle email communications

-- Create scheduled_jobs table for dynamic cron job management
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_key TEXT REFERENCES public.email_templates(template_key) ON DELETE SET NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- for custom schedules (e.g., '0 8 * * *')
  timezone TEXT NOT NULL DEFAULT 'UTC',
  hour INTEGER, -- for daily/weekly jobs (0-23)
  minute INTEGER DEFAULT 0, -- for daily/weekly jobs (0-59)
  day_of_week INTEGER, -- for weekly jobs (0=Sunday, 6=Saturday)
  day_of_month INTEGER, -- for monthly jobs (1-31)
  is_active BOOLEAN DEFAULT true,
  recipient_filter TEXT NOT NULL DEFAULT 'all',
  custom_variables JSONB DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sender_addresses table for managing email sender addresses
CREATE TABLE IF NOT EXISTS public.sender_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  purpose TEXT, -- e.g., 'support', 'technical', 'noreply', 'personal'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inbox_messages table for received emails
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for scheduled_jobs
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_template_key ON public.scheduled_jobs(template_key);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_is_active ON public.scheduled_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON public.scheduled_jobs(next_run_at) WHERE is_active = true;

-- Create indexes for inbox_messages
CREATE INDEX IF NOT EXISTS idx_inbox_messages_to_email ON public.inbox_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_is_read ON public.inbox_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_received_at ON public.inbox_messages(received_at DESC);

-- Enable RLS on scheduled_jobs
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_jobs (admin only)
CREATE POLICY "Admins can view scheduled jobs"
  ON public.scheduled_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert scheduled jobs"
  ON public.scheduled_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Admins can update scheduled jobs"
  ON public.scheduled_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete scheduled jobs"
  ON public.scheduled_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

-- Enable RLS on sender_addresses
ALTER TABLE public.sender_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for sender_addresses (admin only)
CREATE POLICY "Admins can view sender addresses"
  ON public.sender_addresses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage sender addresses"
  ON public.sender_addresses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

-- Enable RLS on inbox_messages
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for inbox_messages (admin only)
CREATE POLICY "Admins can view inbox messages"
  ON public.inbox_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage inbox messages"
  ON public.inbox_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

-- Add comments
COMMENT ON TABLE public.scheduled_jobs IS 'Stores dynamic email job schedules manageable through admin dashboard';
COMMENT ON TABLE public.sender_addresses IS 'Stores available sender email addresses for admin use';
COMMENT ON TABLE public.inbox_messages IS 'Stores received emails for admin inbox';

-- Function to update next_run_at based on schedule
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_schedule_type TEXT,
  p_timezone TEXT,
  p_hour INTEGER,
  p_minute INTEGER,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_cron_expression TEXT,
  p_current_time TIMESTAMPTZ
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
BEGIN
  -- For now, we'll calculate basic next run times
  -- More sophisticated cron parsing can be added later
  
  IF p_schedule_type = 'daily' THEN
    -- Next occurrence of hour:minute in specified timezone
    v_next_run := (
      (DATE_TRUNC('day', p_current_time AT TIME ZONE p_timezone) + 
       INTERVAL '1 day' * CASE 
         WHEN (EXTRACT(HOUR FROM p_current_time AT TIME ZONE p_timezone) * 60 + 
               EXTRACT(MINUTE FROM p_current_time AT TIME ZONE p_timezone)) >= (p_hour * 60 + p_minute)
         THEN 1 
         ELSE 0 
       END +
       INTERVAL '1 hour' * p_hour + 
       INTERVAL '1 minute' * p_minute
      ) AT TIME ZONE p_timezone
    );
    
  ELSIF p_schedule_type = 'weekly' THEN
    -- Next occurrence of day_of_week at hour:minute
    v_next_run := (
      (DATE_TRUNC('week', p_current_time AT TIME ZONE p_timezone) + 
       INTERVAL '1 day' * p_day_of_week +
       INTERVAL '1 hour' * p_hour + 
       INTERVAL '1 minute' * p_minute
      ) AT TIME ZONE p_timezone
    );
    
    IF v_next_run <= p_current_time THEN
      v_next_run := v_next_run + INTERVAL '7 days';
    END IF;
    
  ELSIF p_schedule_type = 'monthly' THEN
    -- Next occurrence of day_of_month at hour:minute
    v_next_run := (
      (DATE_TRUNC('month', p_current_time AT TIME ZONE p_timezone) + 
       INTERVAL '1 day' * (p_day_of_month - 1) +
       INTERVAL '1 hour' * p_hour + 
       INTERVAL '1 minute' * p_minute
      ) AT TIME ZONE p_timezone
    );
    
    IF v_next_run <= p_current_time THEN
      v_next_run := (
        (DATE_TRUNC('month', p_current_time AT TIME ZONE p_timezone) + INTERVAL '1 month' +
         INTERVAL '1 day' * (p_day_of_month - 1) +
         INTERVAL '1 hour' * p_hour + 
         INTERVAL '1 minute' * p_minute
        ) AT TIME ZONE p_timezone
      );
    END IF;
  END IF;
  
  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate next_run_at
CREATE OR REPLACE FUNCTION update_scheduled_job_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active AND NEW.schedule_type != 'custom' THEN
    NEW.next_run_at := calculate_next_run(
      NEW.schedule_type,
      NEW.timezone,
      NEW.hour,
      NEW.minute,
      NEW.day_of_week,
      NEW.day_of_month,
      NEW.cron_expression,
      COALESCE(NEW.last_run_at, NOW())
    );
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_job_next_run
  BEFORE INSERT OR UPDATE ON public.scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_job_next_run();
