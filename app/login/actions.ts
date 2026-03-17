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

