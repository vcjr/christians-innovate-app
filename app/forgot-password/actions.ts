'use server'

import { createClient } from '@/utils/supabase/server'

export async function requestPasswordReset(formData: FormData): Promise<{ message: string }> {
  const email = formData.get('email') as string
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.christiansinnovate.com'

  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?type=recovery`,
  })

  // Always return success — never reveal whether the email exists
  return {
    message: 'If an account exists for that email address, you\'ll receive a password reset link shortly. Check your inbox.',
  }
}
