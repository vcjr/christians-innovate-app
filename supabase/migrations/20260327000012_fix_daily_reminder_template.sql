-- Fix the daily-reminder template subject and variable list.
--
-- Variable mapping (new):
--   day.title     = scripture_reference (e.g. "Genesis 1:1-31") — shown in subject + body heading
--   day.scripture = plain-text content snippet (first ~180 chars of content_markdown)
--                   shown in the highlighted quote block; falls back to scripture_reference
--                   if the day has no content yet
--   day.link      = URL to the plan day page
--   day.number    = sequential day number within the plan
--
-- Previously day.scripture was used in the subject, which caused very long subjects
-- when it contained actual verse text instead of just a reference.

UPDATE public.email_templates
SET
  subject    = 'Today''s Reading: {{day.title}} 📖',
  variables  = '["user.name", "day.title", "day.scripture", "day.link", "day.number"]'::jsonb,
  updated_at = now()
WHERE template_key = 'daily-reminder';
