'use server';

import { createClient } from '@/utils/supabase/server';
import { UserProfile } from '@/types/profile';
import { sanitizeProfileData } from '@/lib/profile-utils';
import { validateUrls } from '@/utils/validation';

/**
 * @function updateProfileAction
 * @description Server Action to securely update the user's profile in Supabase.
 * Performs identity verification and data sanitization.
 */
export async function updateProfileAction(data: Partial<UserProfile>) {
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

  // 3. Database Mutation
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(sanitizedData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return { data: null, error: error.message };
    }

    // Dual-Channel Sync: Update Auth Metadata for Middleware performance
    const metadataUpdate: Record<string, any> = {};
    if (sanitizedData.full_name) metadataUpdate.full_name = sanitizedData.full_name;
    if (sanitizedData.has_completed_onboarding) metadataUpdate.has_completed_onboarding = true;

    if (Object.keys(metadataUpdate).length > 0) {
      await supabase.auth.updateUser({ data: metadataUpdate });
    }

    return { data: profile as UserProfile, error: null };
  } catch (e) {
    return { data: null, error: 'An unexpected error occurred' };
  }
}