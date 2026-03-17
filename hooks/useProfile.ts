'use client';

import { useState, useCallback } from 'react';
import { UserProfile } from '@/types/profile';
import { updateProfileAction } from '@/lib/actions/profile';
import { completeOnboardingAction } from '@/lib/actions/onboarding';

const initialProfile: Partial<UserProfile> = {
  full_name: '',
  bio: '',
  skills: [],
  interests: [],
  linkedin_url: '',
  facebook_url: '',
  twitter_url: '',
  website_url: '',
};

/**
 * @function useProfile
 * @description Shared hook for managing user profile state and persistence.
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Updates the local state of the profile.
   */
  const updateProfile = useCallback((newData: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...newData }));
    setError(null);
  }, []);

  /**
   * Persists the profile data to the database via Server Action.
   */
  const saveProfile = useCallback(async (dataToSave?: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    
    const result = await updateProfileAction(dataToSave || profile);
    
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setProfile(result.data);
    }
    
    setIsLoading(false);
    return result;
  }, [profile]);

  /**
   * Finalizes onboarding via dedicated Server Action.
   */
  const completeOnboarding = useCallback(async (dataToSave?: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    
    const result = await completeOnboardingAction(dataToSave || profile);
    
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setProfile(result.data);
    }
    
    setIsLoading(false);
    return result;
  }, [profile]);

  return {
    profile,
    updateProfile,
    saveProfile,
    completeOnboarding,
    isLoading,
    error,
  };
};