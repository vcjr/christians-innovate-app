-- ============================================================
-- REDESIGN EMAIL TEMPLATES
-- Modern, branded HTML email templates for Christians Innovate
-- ============================================================

-- ============================================================
-- 1. DAILY READING REMINDER
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'daily-reminder',
  'Daily Reading Reminder',
  'Your reading for today — {{day.scripture}} 📖',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Reading Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;">Christians Innovate</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">📖 Daily Reading</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">{{user.name}}</strong>,
              </p>
              <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.6;">
                Your reading for <strong>{{day.title}}</strong> is ready. Stay consistent — every day adds up.
              </p>

              <!-- Scripture callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px 24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#3b82f6;">Today''s Passage</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#1e3a8a;">{{day.scripture}}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{day.link}}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Open Today''s Devotional &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;font-style:italic;text-align:center;">
                &ldquo;Building for the next 5, 50, and 500 years.&rdquo;
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">Christians Innovate &middot; Faith &times; Technology &times; Entrepreneurship</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{user.name}},

Your reading for {{day.title}} is ready.

Today''s Passage: {{day.scripture}}

Open your devotional: {{day.link}}

"Building for the next 5, 50, and 500 years."

Christians Innovate
Unsubscribe: {{unsubscribe_link}}',
  '["user.name", "day.title", "day.scripture", "day.link", "unsubscribe_link"]'::jsonb,
  'Daily reminder email for Bible reading plan subscribers',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 2. WELCOME EMAIL
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'welcome',
  'Welcome to Christians Innovate',
  'Welcome to Christians Innovate, {{user.name}}! 🎉',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Christians Innovate</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);border-radius:12px 12px 0 0;padding:44px 40px;text-align:center;">
              <p style="margin:0 0 12px 0;font-size:40px;line-height:1;">✝️</p>
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Welcome to the Community</h1>
              <p style="margin:0;font-size:15px;color:#93c5fd;font-weight:500;">Christians Innovate</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <p style="margin:0 0 16px 0;font-size:17px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">{{user.name}}</strong> 👋
              </p>
              <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.6;">
                We''re so glad you''re here. Christians Innovate exists to connect Christian professionals, builders, and entrepreneurs committed to creating work that lasts — <em>for the next 5, 50, and 500 years.</em>
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#e2e8f0;"></td></tr>
              </table>

              <p style="margin:0 0 20px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6b7280;">Get Started</p>

              <!-- Feature: Profile -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top" style="padding-top:2px;">
                    <div style="width:36px;height:36px;background-color:#eff6ff;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">👤</div>
                  </td>
                  <td style="padding-left:16px;">
                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:600;color:#111827;">Complete your profile</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Share your skills, interests, and what you''re building.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature: Reading -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top" style="padding-top:2px;">
                    <div style="width:36px;height:36px;background-color:#f0fdf4;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📖</div>
                  </td>
                  <td style="padding-left:16px;">
                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:600;color:#111827;">Join a reading plan</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Stay grounded daily with our Bible reading plans.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature: Connect -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="44" valign="top" style="padding-top:2px;">
                    <div style="width:36px;height:36px;background-color:#fef3c7;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🤝</div>
                  </td>
                  <td style="padding-left:16px;">
                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:600;color:#111827;">Connect with members</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Browse the directory to find collaborators and accountability partners.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature: Share -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td width="44" valign="top" style="padding-top:2px;">
                    <div style="width:36px;height:36px;background-color:#fdf4ff;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🚀</div>
                  </td>
                  <td style="padding-left:16px;">
                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:600;color:#111827;">Share your journey</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Post launches, prayer requests, and wins in the community feed.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;">
                      Go to Your Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">Christians Innovate &middot; Faith &times; Technology &times; Entrepreneurship</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{user.name}},

Welcome to Christians Innovate! We''re so glad you''re here.

Christians Innovate connects Christian professionals, builders, and entrepreneurs committed to creating work that lasts — for the next 5, 50, and 500 years.

Get started:
- Complete your profile and share your skills
- Join a Bible reading plan
- Connect with other members in the directory
- Share your launches, prayers, and wins

Go to your dashboard: {{site_url}}/dashboard

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}',
  '["user.name", "site_url", "unsubscribe_link"]'::jsonb,
  'Welcome email sent to new users upon signup',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 3. MEETING REMINDER
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'meeting-reminder',
  'Meeting Reminder',
  '📅 Reminder: {{meeting.title}} is Tomorrow',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#6ee7b7;">Christians Innovate</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">📅 Meeting Tomorrow</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">{{user.name}}</strong>, this is a friendly reminder about your upcoming community meeting.
              </p>

              <!-- Meeting card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #d1fae5;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="background-color:#ecfdf5;padding:20px 24px;border-bottom:1px solid #d1fae5;">
                    <p style="margin:0;font-size:19px;font-weight:700;color:#065f46;">{{meeting.title}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">When</p>
                          <p style="margin:4px 0 0 0;font-size:15px;color:#111827;font-weight:500;">{{meeting.date}} at {{meeting.time}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">About</p>
                          <p style="margin:4px 0 0 0;font-size:15px;color:#374151;line-height:1.5;">{{meeting.description}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{{meeting.zoom_link}}" style="display:inline-block;background-color:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Join Zoom Meeting &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
                We look forward to seeing you! Arrive a couple of minutes early to get settled.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">Christians Innovate &middot; Faith &times; Technology &times; Entrepreneurship</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{user.name}},

You have a community meeting tomorrow!

{{meeting.title}}
When: {{meeting.date}} at {{meeting.time}}
About: {{meeting.description}}

Join Zoom: {{meeting.zoom_link}}

See you there!
Christians Innovate
Unsubscribe: {{unsubscribe_link}}',
  '["user.name", "meeting.title", "meeting.date", "meeting.time", "meeting.description", "meeting.zoom_link", "unsubscribe_link"]'::jsonb,
  'Meeting reminder sent the day before a scheduled community meeting',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();


-- ============================================================
-- 4. WEEKLY DIGEST
-- ============================================================
INSERT INTO public.email_templates (
  template_key, name, subject, body_html, body_text, variables, description, is_active
) VALUES (
  'weekly-digest',
  'Weekly Community Digest',
  '🌟 This week in Christians Innovate',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Community Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95 0%,#6d28d9 60%,#7c3aed 100%);border-radius:12px 12px 0 0;padding:40px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;">Christians Innovate</p>
              <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">🌟 Weekly Digest</h1>
              <p style="margin:0;font-size:14px;color:#ddd6fe;">Here''s what happened in your community this week</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">

              <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">{{user.name}}</strong>, here''s a quick look at what the Christians Innovate community shared this week.
              </p>

              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td width="31%" style="text-align:center;background-color:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px 8px;">
                    <p style="margin:0 0 6px 0;font-size:32px;font-weight:800;color:#7c3aed;">{{digest.launches}}</p>
                    <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#7c3aed;">🚀 Launches</p>
                  </td>
                  <td width="4%"></td>
                  <td width="30%" style="text-align:center;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 8px;">
                    <p style="margin:0 0 6px 0;font-size:32px;font-weight:800;color:#2563eb;">{{digest.prayers}}</p>
                    <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#2563eb;">🙏 Prayers</p>
                  </td>
                  <td width="4%"></td>
                  <td width="31%" style="text-align:center;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 8px;">
                    <p style="margin:0 0 6px 0;font-size:32px;font-weight:800;color:#16a34a;">{{digest.wins}}</p>
                    <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#16a34a;">🎉 Wins</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#e2e8f0;"></td></tr>
              </table>

              <p style="margin:0 0 28px 0;font-size:15px;color:#374151;line-height:1.6;">
                Every post, prayer, and launch matters. Your presence in this community is part of something bigger — a body of builders working for God''s kingdom.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/launch-prayer" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      View Community Feed &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">Christians Innovate &middot; Faith &times; Technology &times; Entrepreneurship</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{user.name}},

Here''s what happened in the Christians Innovate community this week:

🚀 Launches: {{digest.launches}}
🙏 Prayers:  {{digest.prayers}}
🎉 Wins:     {{digest.wins}}

Every post, prayer, and launch matters. Your presence in this community is part of something bigger.

View the community feed: {{site_url}}/launch-prayer

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}',
  '["user.name", "digest.launches", "digest.prayers", "digest.wins", "site_url", "unsubscribe_link"]'::jsonb,
  'Weekly summary of community activity sent to CI Updates subscribers',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  subject     = EXCLUDED.subject,
  body_html   = EXCLUDED.body_html,
  body_text   = EXCLUDED.body_text,
  variables   = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at  = now();
