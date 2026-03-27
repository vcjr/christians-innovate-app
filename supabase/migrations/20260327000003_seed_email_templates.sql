-- Migration to seed default email templates
-- This creates four initial templates: daily-reminder, welcome, meeting-reminder, and weekly-digest

-- Insert daily-reminder template
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, variables, description, is_active)
VALUES (
  'daily-reminder',
  'Daily Reading Reminder',
  'Today''s Reading: {{day.scripture}}',
  '<h2 style="color: #1f2937; margin-bottom: 16px;">📖 Today''s Reading</h2>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Hello {{user.name}},
</p>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
  It''s time for today''s reading from <strong>{{day.title}}</strong>.
</p>
<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
  <p style="color: #1e3a8a; font-size: 18px; font-weight: 600; margin: 0;">
    {{day.scripture}}
  </p>
</div>
<p style="margin-bottom: 24px;">
  <a href="{{day.link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
    Read Today''s Devotional →
  </a>
</p>
<p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
  Stay consistent in your faith journey. We''re building for the next 5, 50, and 500 years.
</p>',
  'Hello {{user.name}},

It''s time for today''s reading from {{day.title}}.

Scripture: {{day.scripture}}

Read today''s devotional: {{day.link}}

Stay consistent in your faith journey. We''re building for the next 5, 50, and 500 years.

Christians Innovate',
  '["user.name", "day.title", "day.scripture", "day.link"]'::jsonb,
  'Daily reminder email for Bible reading plan subscribers',
  true
)
ON CONFLICT (template_key) DO UPDATE
SET 
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert welcome template
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, variables, description, is_active)
VALUES (
  'welcome',
  'Welcome to Christians Innovate',
  'Welcome to Christians Innovate, {{user.name}}! 🎉',
  '<h2 style="color: #1f2937; margin-bottom: 16px;">Welcome to Christians Innovate! 🎉</h2>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Hello {{user.name}},
</p>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  We''re excited to have you join our community of Christian professionals and entrepreneurs who are building for the next 5, 50, and 500 years.
</p>
<h3 style="color: #1f2937; font-size: 18px; margin-top: 24px; margin-bottom: 12px;">Get Started:</h3>
<ul style="color: #4b5563; line-height: 1.8; margin-bottom: 24px;">
  <li><strong>Complete your profile</strong> - Share your skills, interests, and what you''re looking for</li>
  <li><strong>Join a reading plan</strong> - Stay consistent in God''s Word with our Bible reading plans</li>
  <li><strong>Connect with members</strong> - Browse the directory to find potential partners and accountability</li>
  <li><strong>Share your journey</strong> - Post launches, prayer requests, and wins in the community feed</li>
</ul>
<p style="margin-bottom: 24px; text-align: center;">
  <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
    Go to Dashboard
  </a>
</p>
<p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
  Questions? Reach out to our team at any time. We''re here to support you.
</p>',
  'Hello {{user.name}},

Welcome to Christians Innovate! We''re excited to have you join our community.

Get Started:
- Complete your profile and share your skills
- Join a Bible reading plan
- Connect with other members
- Share your launches, prayers, and wins

Go to Dashboard: http://localhost:3000/dashboard

Building for the next 5, 50, and 500 years.

Christians Innovate',
  '["user.name"]'::jsonb,
  'Welcome email sent to new users upon signup',
  true
)
ON CONFLICT (template_key) DO UPDATE
SET 
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert meeting-reminder template
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, variables, description, is_active)
VALUES (
  'meeting-reminder',
  'Meeting Reminder',
  'Reminder: {{meeting.title}} is Tomorrow',
  '<h2 style="color: #1f2937; margin-bottom: 16px;">📅 Meeting Reminder</h2>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Hello {{user.name}},
</p>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
  This is a reminder that we have a community meeting tomorrow:
</p>
<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
  <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 20px;">{{meeting.title}}</h3>
  <p style="color: #78350f; margin: 0 0 8px 0;"><strong>📅 When:</strong> {{meeting.date}} at {{meeting.time}}</p>
  <p style="color: #78350f; margin: 0;">{{meeting.description}}</p>
</div>
<p style="margin-bottom: 24px; text-align: center;">
  <a href="{{meeting.zoom_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
    Join Zoom Meeting →
  </a>
</p>
<p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
  We look forward to seeing you there! Don''t forget to arrive a few minutes early.
</p>',
  'Hello {{user.name}},

Meeting Reminder: {{meeting.title}}

When: {{meeting.date}} at {{meeting.time}}

{{meeting.description}}

Join Zoom: {{meeting.zoom_link}}

We look forward to seeing you there!

Christians Innovate',
  '["user.name", "meeting.title", "meeting.date", "meeting.time", "meeting.description", "meeting.zoom_link"]'::jsonb,
  'Reminder email sent day before scheduled meetings',
  true
)
ON CONFLICT (template_key) DO UPDATE
SET 
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert weekly-digest template
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, variables, description, is_active)
VALUES (
  'weekly-digest',
  'Weekly Community Digest',
  'Your Weekly Digest from Christians Innovate',
  '<h2 style="color: #1f2937; margin-bottom: 16px;">📬 Your Weekly Digest</h2>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Hello {{user.name}},
</p>
<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
  Here''s what happened in the Christians Innovate community this past week:
</p>

<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
  <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">Community Activity</h3>
  <div style="display: grid; gap: 12px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 24px;">🚀</span>
      <span style="color: #4b5563;"><strong>{{digest.launches}}</strong> new launches shared</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 24px;">🙏</span>
      <span style="color: #4b5563;"><strong>{{digest.prayers}}</strong> prayer requests posted</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 24px;">🎉</span>
      <span style="color: #4b5563;"><strong>{{digest.wins}}</strong> wins celebrated</span>
    </div>
  </div>
</div>

<p style="margin-bottom: 24px; text-align: center;">
  <a href="http://localhost:3000/launch-prayer" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
    View Community Feed →
  </a>
</p>

<p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
  Keep building, keep praying, keep connecting. We''re in this together for the long haul.
</p>',
  'Hello {{user.name}},

Your Weekly Digest from Christians Innovate

Community Activity This Week:
🚀 {{digest.launches}} new launches
🙏 {{digest.prayers}} prayer requests
🎉 {{digest.wins}} wins celebrated

View the community feed: http://localhost:3000/launch-prayer

Keep building for the next 5, 50, and 500 years.

Christians Innovate',
  '["user.name", "digest.launches", "digest.prayers", "digest.wins"]'::jsonb,
  'Weekly summary email sent to members every Monday',
  true
)
ON CONFLICT (template_key) DO UPDATE
SET 
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Log the insertion
DO $$
BEGIN
  RAISE NOTICE 'Default email templates have been seeded successfully';
END $$;
