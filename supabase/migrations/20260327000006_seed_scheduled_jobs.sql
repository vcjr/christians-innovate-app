-- Seed default scheduled jobs and sender addresses

-- Insert default scheduled jobs (migrating existing cron jobs)
INSERT INTO public.scheduled_jobs (
  name,
  description,
  template_key,
  schedule_type,
  timezone,
  hour,
  minute,
  recipient_filter,
  is_active
) VALUES
  (
    'Daily Reading Reminders',
    'Send daily reminders to users about their current reading plan day',
    'daily-reminder',
    'daily',
    'America/New_York',
    8,
    0,
    'bible_year',
    true
  ),
  (
    'Meeting Reminders',
    'Send reminders to users about upcoming meetings (day before at 6pm)',
    'meeting-reminder',
    'daily',
    'America/New_York',
    18,
    0,
    'email_enabled',
    true
  ),
  (
    'Weekly Digest',
    'Send weekly community digest every Monday morning',
    'weekly-digest',
    'weekly',
    'America/New_York',
    9,
    0,
    'ci_updates',
    true
  )
ON CONFLICT DO NOTHING;

-- Insert default sender addresses
INSERT INTO public.sender_addresses (
  email_address,
  display_name,
  purpose,
  is_active
) VALUES
  (
    'noreply@christiansinnovate.com',
    'Christians Innovate',
    'noreply',
    true
  ),
  (
    'support@christiansinnovate.com',
    'Christians Innovate Support',
    'support',
    true
  ),
  (
    'tech@christiansinnovate.com',
    'Christians Innovate Tech Team',
    'technical',
    true
  ),
  (
    'admin@christiansinnovate.com',
    'Christians Innovate Admin',
    'admin',
    true
  ),
  (
    'community@christiansinnovate.com',
    'Christians Innovate Community',
    'community',
    true
  )
ON CONFLICT (email_address) DO NOTHING;

-- Update next_run_at for all active jobs
UPDATE public.scheduled_jobs
SET next_run_at = calculate_next_run(
  schedule_type,
  timezone,
  hour,
  minute,
  day_of_week,
  day_of_month,
  cron_expression,
  NOW()
)
WHERE is_active = true AND schedule_type != 'custom';
