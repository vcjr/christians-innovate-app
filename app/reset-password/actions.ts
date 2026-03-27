'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/

export async function resetPassword(formData: FormData): Promise<{ error: string } | never> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (!PASSWORD_RULES.test(password)) {
    return { error: 'Password must be at least 8 characters and contain uppercase, lowercase, a number, and a special character.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  // Sign out so the user logs in fresh with their new password
  await supabase.auth.signOut()

  redirect('/login?message=' + encodeURIComponent('Password updated successfully. Please log in with your new password.'))
}
