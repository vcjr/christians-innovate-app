'use server'

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL('/login?message=' + encodeURIComponent('Invalid confirmation link. Please try again.'), request.url)
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    return NextResponse.redirect(
      new URL('/login?message=' + encodeURIComponent('This link has expired or is invalid. Please request a new one.'), request.url)
    )
  }

  // Password recovery — send to reset password page
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password', request.url))
  }

  // Email change confirmed — send to settings
  if (type === 'email_change') {
    return NextResponse.redirect(
      new URL('/settings?message=' + encodeURIComponent('Email address updated successfully.'), request.url)
    )
  }

  // New signup or invite — check onboarding status
  if (type === 'signup' || type === 'invite') {
    const { data: { user } } = await supabase.auth.getUser()
    const hasCompletedOnboarding = user?.user_metadata?.has_completed_onboarding === true
    return NextResponse.redirect(
      new URL(hasCompletedOnboarding ? '/dashboard' : '/onboarding', request.url)
    )
  }

  // Magic link and all other types — honor `next` param or fall back to dashboard
  return NextResponse.redirect(new URL(next, request.url))
}
