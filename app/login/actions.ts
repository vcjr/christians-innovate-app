'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  // Ensure user has a profile (for users created before profile system)
  if (authData?.user) {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (!existingProfile) {
      // Create profile for user if it doesn't exist
      await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          ci_updates: false,
          bible_year: false,
          skill_share: false
        })
    }
  }

  // Pillar: Performance - Use metadata from the auth response to avoid extra DB queries.
  // Pillar: UX - Proactively redirect to the correct landing page to prevent "double-click" URL mismatch.
  const hasCompletedOnboarding = authData.user?.user_metadata?.has_completed_onboarding === true

  revalidatePath('/', 'layout')
  
  // If onboarding is not complete, send them straight to the funnel.
  // Otherwise, proceed to the dashboard.
  redirect(hasCompletedOnboarding ? '/dashboard' : '/onboarding')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const ciUpdates = formData.get('ci_updates') === 'true'
  const bibleYear = formData.get('bible_year') === 'true'
  const skillShare = formData.get('skill_share') === 'true'
  const referral = formData.get('referral') as string

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (authError) {
    redirect('/login?mode=signup&message=' + encodeURIComponent(authError.message))
  }

  // Create user profile with preferences
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        ci_updates: ciUpdates,
        bible_year: bibleYear,
        skill_share: skillShare,
        referral: referral || null,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue anyway - the auth account was created
    }
  }

  // Supabase may require email confirmation - redirect with success message
  redirect('/login?mode=login&message=' + encodeURIComponent('Check your email to confirm your account before logging in'))
}
