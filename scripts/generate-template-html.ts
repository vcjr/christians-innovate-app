// Temporary script to generate block-composed HTML for migration
import { composeEmail } from '../utils/email/compose'
import type { EmailBlock } from '../utils/email/blocks'

// ── 1. Daily Reminder blocks ──────────────────────────────────────────────
const dailyReminderBlocks: EmailBlock[] = [
  { type: 'badge', text: 'Daily Reading', color: 'blue' },
  {
    type: 'hero',
    heading: '📖 Today\'s Reading',
    body: 'Hi <strong>{{user.name}}</strong>, your reading for <strong>{{day.title}}</strong> is ready. Stay consistent — every day adds up.',
  },
  {
    type: 'scripture',
    label: 'Today\'s Passage',
    text: '{{day.scripture}}',
    reference: '',
  },
  { type: 'primary-cta', label: 'Open Today\'s Devotional →', url: '{{day.link}}' },
  { type: 'divider' },
  {
    type: 'hero',
    heading: '',
    body: '<em>"Building for the next 5, 50, and 500 years."</em>',
  },
]

// ── 2. Welcome blocks ─────────────────────────────────────────────────────
const welcomeBlocks: EmailBlock[] = [
  { type: 'badge', text: 'Welcome', color: 'blue' },
  {
    type: 'hero',
    heading: 'Welcome to Christians Innovate! 🎉',
    body: 'Hi <strong>{{user.name}}</strong> 👋<br><br>We\'re so glad you\'re here. Christians Innovate connects Christian professionals, builders, and entrepreneurs committed to creating work that lasts — <em>for the next 5, 50, and 500 years.</em>',
  },
  { type: 'divider' },
  {
    type: 'feature-grid',
    sectionLabel: 'Get Started',
    features: [
      { emoji: '👤', title: 'Complete your profile', description: 'Share your skills, interests, and what you\'re building.' },
      { emoji: '📖', title: 'Join a reading plan', description: 'Stay grounded daily with our Bible reading plans.' },
      { emoji: '🤝', title: 'Connect with members', description: 'Browse the directory to find collaborators and accountability partners.' },
      { emoji: '🚀', title: 'Share your journey', description: 'Post launches, prayer requests, and wins in the community feed.' },
    ],
  },
  { type: 'primary-cta', label: 'Go to Your Dashboard →', url: '{{site_url}}/dashboard' },
]

// ── 3. Meeting Reminder blocks ────────────────────────────────────────────
const meetingReminderBlocks: EmailBlock[] = [
  { type: 'badge', text: 'Meeting Reminder', color: 'green' },
  {
    type: 'hero',
    heading: '📅 Meeting Tomorrow',
    body: 'Hi <strong>{{user.name}}</strong>, this is a friendly reminder about your upcoming community meeting.',
  },
  {
    type: 'detail-card',
    rows: [
      { emoji: '📋', label: 'Meeting', value: '{{meeting.title}}' },
      { emoji: '📅', label: 'When', value: '{{meeting.date}} at {{meeting.time}}' },
      { emoji: '💬', label: 'About', value: '{{meeting.description}}' },
    ],
  },
  { type: 'primary-cta', label: 'Join Zoom Meeting →', url: '{{meeting.zoom_link}}' },
  {
    type: 'hero',
    heading: '',
    body: 'We look forward to seeing you! Arrive a couple of minutes early to get settled.',
  },
]

// ── 4. Weekly Digest blocks ───────────────────────────────────────────────
const weeklyDigestBlocks: EmailBlock[] = [
  { type: 'badge', text: 'Weekly Digest', color: 'purple' },
  {
    type: 'hero',
    heading: '🌟 This Week in the Community',
    body: 'Hi <strong>{{user.name}}</strong>, here\'s a quick look at what the Christians Innovate community shared this week.',
  },
  {
    type: 'stats-row',
    stats: [
      { emoji: '🚀', value: '{{digest.launches}}', label: 'Launches' },
      { emoji: '🙏', value: '{{digest.prayers}}', label: 'Prayers' },
      { emoji: '🎉', value: '{{digest.wins}}', label: 'Wins' },
    ],
  },
  { type: 'divider' },
  {
    type: 'hero',
    heading: '',
    body: 'Every post, prayer, and launch matters. Your presence in this community is part of something bigger — a body of builders working for God\'s kingdom.',
  },
  { type: 'primary-cta', label: 'View Community Feed →', url: '{{site_url}}/launch-prayer' },
]

// ── Template metadata ─────────────────────────────────────────────────────
interface TemplateDef {
  key: string
  name: string
  subject: string
  blocks: EmailBlock[]
  plainText: string
  variables: string[]
  description: string
}

const templates: TemplateDef[] = [
  {
    key: 'daily-reminder',
    name: 'Daily Reading Reminder',
    subject: "Your reading for today — {{day.scripture}} 📖",
    blocks: dailyReminderBlocks,
    plainText: `Hi {{user.name}},

Your reading for {{day.title}} is ready.

Today's Passage: {{day.scripture}}

Open your devotional: {{day.link}}

"Building for the next 5, 50, and 500 years."

Christians Innovate
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user.name', 'day.title', 'day.scripture', 'day.link', 'unsubscribe_link'],
    description: 'Daily reminder email for Bible reading plan subscribers',
  },
  {
    key: 'welcome',
    name: 'Welcome to Christians Innovate',
    subject: 'Welcome to Christians Innovate, {{user.name}}! 🎉',
    blocks: welcomeBlocks,
    plainText: `Hi {{user.name}},

Welcome to Christians Innovate! We're so glad you're here.

Christians Innovate connects Christian professionals, builders, and entrepreneurs committed to creating work that lasts — for the next 5, 50, and 500 years.

Get started:
- Complete your profile and share your skills
- Join a Bible reading plan
- Connect with other members in the directory
- Share your launches, prayers, and wins

Go to your dashboard: {{site_url}}/dashboard

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user.name', 'site_url', 'unsubscribe_link'],
    description: 'Welcome email sent to new users upon signup',
  },
  {
    key: 'meeting-reminder',
    name: 'Meeting Reminder',
    subject: '📅 Reminder: {{meeting.title}} is Tomorrow',
    blocks: meetingReminderBlocks,
    plainText: `Hi {{user.name}},

You have a community meeting tomorrow!

{{meeting.title}}
When: {{meeting.date}} at {{meeting.time}}
About: {{meeting.description}}

Join Zoom: {{meeting.zoom_link}}

See you there!
Christians Innovate
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user.name', 'meeting.title', 'meeting.date', 'meeting.time', 'meeting.description', 'meeting.zoom_link', 'unsubscribe_link'],
    description: 'Meeting reminder sent the day before a scheduled community meeting',
  },
  {
    key: 'weekly-digest',
    name: 'Weekly Community Digest',
    subject: '🌟 This week in Christians Innovate',
    blocks: weeklyDigestBlocks,
    plainText: `Hi {{user.name}},

Here's what happened in the Christians Innovate community this week:

🚀 Launches: {{digest.launches}}
🙏 Prayers:  {{digest.prayers}}
🎉 Wins:     {{digest.wins}}

Every post, prayer, and launch matters. Your presence in this community is part of something bigger.

View the community feed: {{site_url}}/launch-prayer

Christians Innovate — Faith × Technology × Entrepreneurship
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user.name', 'digest.launches', 'digest.prayers', 'digest.wins', 'site_url', 'unsubscribe_link'],
    description: 'Weekly summary of community activity sent to CI Updates subscribers',
  },
]

// ── Generate SQL migration ────────────────────────────────────────────────

function sqlEsc(s: string): string {
  return s.replace(/'/g, "''")
}

const lines: string[] = [
  '-- ============================================================',
  '-- BLOCK-SYSTEM EMAIL TEMPLATES',
  '-- Generated from composeEmail() block system for light-mode,',
  '-- branded HTML with BLOCKS_META round-trip support.',
  '-- ============================================================',
  '',
]

for (let i = 0; i < templates.length; i++) {
  const t = templates[i]
  const html = composeEmail(t.blocks)
  const num = i + 1

  lines.push(
    `-- ============================================================`,
    `-- ${num}. ${t.name.toUpperCase()}`,
    `-- ============================================================`,
    `INSERT INTO public.email_templates (`,
    `  template_key, name, subject, body_html, body_text, variables, description, is_active`,
    `) VALUES (`,
    `  '${sqlEsc(t.key)}',`,
    `  '${sqlEsc(t.name)}',`,
    `  '${sqlEsc(t.subject)}',`,
    `  '${sqlEsc(html)}',`,
    `  '${sqlEsc(t.plainText)}',`,
    `  '${JSON.stringify(t.variables)}'::jsonb,`,
    `  '${sqlEsc(t.description)}',`,
    `  true`,
    `)`,
    `ON CONFLICT (template_key) DO UPDATE SET`,
    `  name        = EXCLUDED.name,`,
    `  subject     = EXCLUDED.subject,`,
    `  body_html   = EXCLUDED.body_html,`,
    `  body_text   = EXCLUDED.body_text,`,
    `  variables   = EXCLUDED.variables,`,
    `  description = EXCLUDED.description,`,
    `  updated_at  = now();`,
    '',
    '',
  )
}

import * as fs from 'fs'
import * as path from 'path'

const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/20260228000000_block_system_email_templates.sql'
)
fs.writeFileSync(migrationPath, lines.join('\n'), 'utf-8')
console.log(`✅ Migration written to: ${migrationPath}`)
console.log(`   ${lines.length} lines`)
