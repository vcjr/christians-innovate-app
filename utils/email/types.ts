// TypeScript types for email system

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  subject: string
  body_html: string
  body_text: string | null
  variables: string[]
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  user_id: string | null
  recipient_email: string
  template_key: string | null
  subject: string
  status: 'sent' | 'failed' | 'pending'
  resend_id: string | null
  error_message: string | null
  body_html: string | null
  body_text: string | null
  metadata: Record<string, unknown>
  sent_at: string
}

export interface EmailVariables {
  user?: {
    name?: string
    email?: string
    id?: string
  }
  day?: {
    number?: number
    scripture?: string
    title?: string
    content?: string
    link?: string
  }
  meeting?: {
    title?: string
    description?: string
    date?: string
    time?: string
    zoom_link?: string
  }
  digest?: {
    launches?: number
    prayers?: number
    wins?: number
    upcoming_meetings?: Array<{
      title: string
      date: string
    }>
  }
  unsubscribe_link?: string
  [key: string]: unknown
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  templateKey?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface SendBatchEmailParams {
  recipients: Array<{
    email: string
    userId?: string
    variables?: EmailVariables
  }>
  templateKey: string
  subject?: string
  metadata?: Record<string, unknown>
}
