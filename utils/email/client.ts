import { Resend } from 'resend'

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)

// Get the from email address from environment variable
export const getFromEmail = () => {
  return process.env.RESEND_FROM_EMAIL || 'noreply@christiansinnovate.com'
}

// Get the reply-to email address
export const getReplyToEmail = () => {
  return process.env.RESEND_REPLY_TO_EMAIL || undefined
}

// Validate email address format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
