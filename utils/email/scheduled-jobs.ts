export interface ScheduledJob {
  id: string
  name: string
  description: string | null
  template_key: string | null
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom'
  cron_expression: string | null
  timezone: string
  hour: number | null
  minute: number | null
  day_of_week: number | null
  day_of_month: number | null
  is_active: boolean
  recipient_filter: string
  custom_variables: Record<string, unknown>
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
  updated_at: string
}

export interface SenderAddress {
  id: string
  email_address: string
  display_name: string
  purpose: string | null
  is_active: boolean
  created_at: string
}

export interface InboxMessage {
  id: string
  from_email: string
  from_name: string | null
  to_email: string
  reply_to: string | null
  subject: string | null
  body_html: string | null
  body_text: string | null
  headers: Record<string, unknown>
  attachments: unknown[]
  is_read: boolean
  assigned_to: string | null
  replied_at: string | null
  replied_by: string | null
  received_at: string
}

// Common timezones for selection
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
]

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export const formatNextRun = (nextRun: string | null, timezone: string): string => {
  if (!nextRun) return 'Not scheduled'

  const date = new Date(nextRun)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const formatLastRun = (lastRun: string | null, timezone: string): string => {
  if (!lastRun) return 'Never'

  const date = new Date(lastRun)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
