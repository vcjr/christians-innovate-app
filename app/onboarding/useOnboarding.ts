'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter} from 'next/navigation';
import { ONBOARDING_STEPS } from './onboarding';
import { useProfile } from '@/hooks/useProfile';
import { useStepper } from '@/hooks/useStepper';
import { useFilePreview } from '@/hooks/useFilePreview';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/types/profile';
import { clearLocalSessionData } from '@/utils/auth/cleanup';
import Cookies from 'js-cookie';
import { isFile } from '@/utils/type-guards';

/**
 * @function useOnboarding
 * @description Controller hook that orchestrates onboarding logic, navigation, and persistence.
 */
export const useOnboarding = () => {
  const router = useRouter();
  const { profile, updateProfile, completeOnboarding, isLoading, error: profileError } = useProfile();
  
  const [isMounted, setIsMounted] = useState(false);
  /**
   * Pillar: Performance/Maintenance - Memoize the Supabase client.
   * Prevents unnecessary re-subscriptions in useEffect hooks.
   */
  const supabase = useMemo(() => createClient(), []);

  const [checkpoint, setCheckpoint] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('onboarding_checkpoint') || '-1', 10);
    }
    return -1;
  });

  // 1. Initialize Generic Hooks
  const stepper = useStepper({
    totalSteps: ONBOARDING_STEPS.length,
    checkpoint,
    focusTargetId: 'onboarding-content',
    isActive: isMounted,
  });

  const previews = useFilePreview();
  const persistence = useFormPersistence<UserProfile>({
    key: 'onboarding',
    fileFields: ['avatar_url'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

  // 2. Rehydration Logic: Restore session on mount
  useEffect(() => {
    const init = async () => {
      const savedData = await persistence.rehydrate();
      const updates: Partial<UserProfile> = { ...savedData };

      // Pre-seed full_name from auth metadata so the onboarding upsert
      // doesn't overwrite the name the handle_new_user trigger wrote.
      if (!updates.full_name) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
          updates.full_name = user.user_metadata.full_name;
        }
      }

      // Convert rehydrated Files back into preview URLs for the UI
      for (const field of ['avatar_url'] as const) {
        const value = savedData[field];
        if (isFile(value)) {
          updates[field] = previews.getPreview(field, value);
          setPendingFiles((prev) => ({ ...prev, [field]: value }));
      }
    }

      updateProfile(updates);
    setIsMounted(true);
    };
    init();
  }, [persistence, previews, updateProfile, supabase]);

  /**
   * Pillar: Performance - Sync progress to cookie for middleware-based resumption.
   * This allows the server to redirect the user to the correct step before hydration.
   */
  useEffect(() => {
    if (isMounted) {
      // SameSite=Lax ensures the cookie is sent during redirects from external sites
      Cookies.set('onboarding_step', stepper.currentStep.toString(), { expires: 7, sameSite: 'lax', path: '/' });
    }
  }, [stepper.currentStep, isMounted]);

  /**
   * Updates the onboarding data and persists it to localStorage.
   */
  const updateData = useCallback(async (newData: Record<string, any>) => {
    const updates: Partial<UserProfile> = { ...newData };

    // Pillar: Maintenance - Handle Checkbox Group to Boolean Field mapping
    Object.keys(newData).forEach(key => {
      const step = ONBOARDING_STEPS.find(s => s.id === key && s.inputType === 'checkbox-group');
      if (step && step.options) {
        const selectedValues = newData[key] as string[];
        step.options.forEach(opt => {
          if (opt.targetField) {
            // Map the presence of a value in the array to a boolean field
            updates[opt.targetField] = selectedValues.includes(opt.value) as any;
          }
        });
        // Clean up the UI-only group key if it's not a database field
        if (step.fieldName !== key) delete updates[key as keyof UserProfile];
      }
    });

    // Pillar: Performance - Handle File previews and persistence
    for (const key in updates) {
      const value = updates[key as keyof UserProfile];
      if (isFile(value)) {
        const previewUrl = previews.getPreview(key, value);
        updates[key as keyof UserProfile] = previewUrl as any;
        setPendingFiles(prev => ({ ...prev, [key]: value }));
      }
    }

    updateProfile(updates);
    await persistence.save(newData);
    setError(null);
  }, [updateProfile, previews, persistence]);

  /**
   * Validates current step, updates checkpoint, and moves to next URL.
   */
  const nextStep = useCallback(() => {
    const currentStepMeta = ONBOARDING_STEPS[stepper.currentStep];
    
    if (currentStepMeta?.required && currentStepMeta.fieldName) {
      const value = profile[currentStepMeta.fieldName];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setError(`${currentStepMeta.question} is required.`);
        return;
      }
    }

    localStorage.setItem('onboarding_checkpoint', stepper.currentStep.toString());
    setCheckpoint(stepper.currentStep);
    stepper.nextStep();
  }, [stepper, profile]);

  /**
   * Finalizes onboarding by persisting to Supabase.
   */
  const submitOnboarding = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Multi-Step Validation
    for (const step of ONBOARDING_STEPS) {
      if (step.required && step.fieldName) {
        const value = profile[step.fieldName];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          setError(`Please complete the "${step.label}" section.`);
          router.push(`?step=${step.order}`);
          setIsSubmitting(false);
          return;
        }
      }
    }

      // 2. Auth Guard
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User session not found. Please sign in again.');
        setIsSubmitting(false);
        return;
      }

      // 3. Parallel File Processing (Pillar: Performance)
      const uploadPromises = Object.entries(pendingFiles).map(async ([key, file]) => {
        const fileExt = file.name.split('.').pop();
        const path = `${user.id}/${key}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        return { key, publicUrl };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // 4. URL Transformation & Payload Merging
      const finalPayload = { ...profile };
      uploadedFiles.forEach(({ key, publicUrl }) => {
        finalPayload[key as keyof UserProfile] = publicUrl as any;
      });

      // 5. Atomic Completion & Session Sync
      const result = await completeOnboarding(finalPayload);
      if (result.error) throw new Error(result.error);

      await supabase.auth.refreshSession();

      // 6. State Cleanup (Pillar: Maintenance)
      localStorage.setItem('onboarding_status', 'complete');
      await clearLocalSessionData({ preserveStatus: true });
      Object.keys(pendingFiles).forEach(key => previews.clearPreview(key));

      // Pillar: Security - Issue a short-lived token for one-time success page access (5 mins)
      Cookies.set('sb_success_auth', 'true', { expires: 5 / (24 * 60), sameSite: 'lax' });
      
      // Pillar: UX - Replace history entry to prevent "Back" button loops
      router.replace('/onboarding/success');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during submission.');
      setIsSubmitting(false);
    }
  }, [profile, pendingFiles, completeOnboarding, router, supabase, persistence, previews]);

  return {
    currentStep: stepper.currentStep,
    data: profile,
    updateData,
    error: error || profileError,
    nextStep,
    submitOnboarding,
    prevStep: stepper.prevStep,
    progress: stepper.progress,
    isLoading: isLoading || isSubmitting || stepper.isNavigating,
    isLastStep: stepper.isLastStep,
    totalSteps: stepper.totalSteps,
    isMounted,
  };
};