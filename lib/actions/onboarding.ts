'use server';

import { createClient } from '@/utils/supabase/server';
import { UserProfile } from '@/types/profile';
import { sanitizeProfileData } from '@/lib/profile-utils';
import { validateUrls } from '@/utils/validation';

/**
 * @function completeOnboardingAction
 * @description Atomic Server Action to finalize onboarding.
 * Updates the user_profiles table and Auth metadata simultaneously.
 */
export async function completeOnboardingAction(data: Partial<UserProfile>) {
  const supabase = await createClient();

  // 1. Identity Verification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  // 2. Data Sanitization & Validation
  const sanitizedData = sanitizeProfileData(data);
  const urlError = validateUrls(data);
  if (urlError) return { data: null, error: urlError };

  // 3. Force Onboarding Completion Flag
  const finalData = {
    ...sanitizedData,
    has_completed_onboarding: true,
  };

  try {
    // 4. Database Mutation (user_profiles table)
    const { data: profile, error: dbError } = await supabase
      .from('user_profiles')
      .update(finalData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError) {
      console.error('Onboarding DB update error:', dbError);
      return { data: null, error: dbError.message };
    }

    // 5. Auth Metadata Sync (auth.users table)
    // This is critical for Middleware performance and JWT consistency
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { has_completed_onboarding: true }
    });

    if (authUpdateError) {
      console.error('Onboarding Auth metadata error:', authUpdateError);
    }

    return { data: profile as UserProfile, error: null };
  } catch (e) {
    return { data: null, error: 'An unexpected error occurred during onboarding completion' };
  }
}