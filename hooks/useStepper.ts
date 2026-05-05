'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseStepperOptions {
  totalSteps: number;
  initialStep?: number;
  checkpoint?: number; // The highest step index the user has completed
  onGuardrailTriggered?: (redirectStep: number) => void;
  focusTargetId?: string; // ID of the element to focus for A11y
  isActive?: boolean; // Whether the stepper should handle navigation logic
}

/**
 * @function useStepper
 * @description A generic hook for managing multi-step forms, URL synchronization,
 * navigation, and guardrails.
 * @param {UseStepperOptions} options - Configuration options for the stepper.
 * @returns {object} Stepper control functions and state.
 */
export const useStepper = ({
  totalSteps,
  initialStep = 0,
  checkpoint = -1,
  onGuardrailTriggered,
  focusTargetId,
  isActive = true,
}: UseStepperOptions) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get('step');
  const currentStepFromUrl = stepParam ? parseInt(stepParam, 10) : initialStep;

  const [currentStep, setCurrentStep] = useState(currentStepFromUrl);
  const [isNavigating, setIsNavigating] = useState(false);

  // Sync internal state with URL changes
  useEffect(() => {
    if (currentStepFromUrl !== currentStep) {
      setCurrentStep(currentStepFromUrl);
    }
  }, [currentStepFromUrl, currentStep]);

  // Navigation Guardrail & Auto-Resume Logic
  useEffect(() => {
    if (!isActive) return;

    // Anti-Skip Guardrail: Prevent accessing steps beyond checkpoint + 1
    if (currentStep > checkpoint + 1) {
      const redirectStep = checkpoint + 1;
      router.replace(`?step=${redirectStep}`);
      setIsNavigating(false);
      onGuardrailTriggered?.(redirectStep);
      return;
    }

    // Focus management for A11y: Move focus to the main container on step change
    if (focusTargetId) {
      const container = document.getElementById(focusTargetId);
      if (container) {
        container.focus();
      }
    }

    // Release navigation lock when the URL step matches the state
    if (isNavigating && currentStepFromUrl === currentStep) {
      const timer = setTimeout(() => setIsNavigating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentStepFromUrl, checkpoint, router, stepParam, isNavigating, onGuardrailTriggered, focusTargetId, isActive]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1 && !isNavigating) {
      setIsNavigating(true);
      router.push(`?step=${currentStep + 1}`);
    }
  }, [currentStep, totalSteps, router, isNavigating]);

  const prevStep = useCallback(() => {
    if (currentStep > 0 && !isNavigating) {
      setIsNavigating(true);
      router.back();
    }
  }, [currentStep, router, isNavigating]);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return {
    currentStep,
    nextStep,
    prevStep,
    progress,
    isNavigating,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    totalSteps,
  };
};