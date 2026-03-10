'use client';

import React, { Suspense, useMemo } from 'react';
import { useOnboarding } from './useOnboarding';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import Card from '@/components/Card/Card';
import DynamicInput from '@/components/DynamicInput/DynamicInput';
import TagInput from '@/components/TagInput/TagInput';
import PhotoInput from '@/components/PhotoInput/PhotoInput';
import CheckboxGroup from '@/components/CheckboxGroup/CheckboxGroup';
import { ONBOARDING_STEPS } from './onboarding';

/**
 * @function OnboardingPage
 * @description Main orchestrator for the multi-step onboarding flow.
 * Uses a switch-case pattern to render the active step component.
 */
export default function OnboardingPage() {
  const { 
    currentStep, 
    data, 
    error,
    updateData, 
    nextStep, 
    prevStep,
    submitOnboarding,
    isLastStep,
    isLoading,
    progress, 
    isMounted 
  } = useOnboarding();

  // Direct indexing for 0-based alignment
  const currentStepMeta = useMemo(() => ONBOARDING_STEPS[currentStep], [currentStep]);

  // Prevent hydration mismatch by not rendering until mounted on client
  if (!isMounted) return null;

  

  const renderStep = () => {
    if (!currentStepMeta) return null;

    // 1. Check for custom component override
    if (currentStepMeta.component) {
      const CustomStep = currentStepMeta.component;
      return (
        <Suspense fallback={<div className="py-10 text-center">Loading step...</div>}>
          <CustomStep onNext={nextStep} data={data} updateData={updateData} />
        </Suspense>
      );
    }

    // 2. Handle TagInput type
    if (currentStepMeta.inputType === 'tags' && currentStepMeta.fieldName) {
      return (
          <TagInput
            key={currentStepMeta.id} // Force remount to isolate state between steps
            id={currentStepMeta.id}
            label={currentStepMeta.question}
            initialTags={currentStepMeta.initialTags || []}
            selectedTags={(data[currentStepMeta.fieldName] as string[]) || []}
            variant={currentStepMeta.variant}
            onChange={(tags) => updateData({ [currentStepMeta.fieldName!]: tags })}
          />
      );
    }

    // 3. Handle PhotoInput type
    if (currentStepMeta.inputType === 'photo' && currentStepMeta.fieldName) {
      return (
        <PhotoInput
          label={currentStepMeta.question}
          name={currentStepMeta.id}
          onChange={(file) => updateData({ [currentStepMeta.fieldName!]: file })}
          error={error}
        />
      );
    }

    // 4. Handle CheckboxGroup type
    if (currentStepMeta.inputType === 'checkbox-group') {
      // Pillar: Maintenance - Determine if this group maps to multiple individual fields
      const isMappedGroup = currentStepMeta.options?.some(opt => opt.targetField);
      
      // Gather Logic: Convert individual boolean fields into a single array for the UI
      const computedValue = isMappedGroup
        ? currentStepMeta.options?.filter(opt => opt.targetField && data[opt.targetField]).map(opt => opt.value) || []
        : (data[currentStepMeta.fieldName!] as string[]) || [];

      const handleCheckboxChange = (newValues: string[]) => {
        if (isMappedGroup) {
          // Scatter Logic: Map the array change back to specific boolean field updates (Full Sync)
          const updates: Record<string, boolean> = {};
          currentStepMeta.options?.forEach(opt => {
            if (opt.targetField) {
              updates[opt.targetField] = newValues.includes(opt.value);
            }
          });
          updateData(updates);
        } else if (currentStepMeta.fieldName) {
          updateData({ [currentStepMeta.fieldName]: newValues });
        }
      };

      return (
        <CheckboxGroup
          label={currentStepMeta.question}
          options={currentStepMeta.options || []}
          value={computedValue}
          onChange={handleCheckboxChange}
          error={error}
        />
      );
    }

    // 5. Default to DynamicInput for standard types
    return (
        <DynamicInput
          label={currentStepMeta.question}
          type={currentStepMeta.inputType as any}
          name={currentStepMeta.id}
          value={(data[currentStepMeta.fieldName!] as string) || ''}
          onChange={(e) => updateData({ [currentStepMeta.fieldName!]: e.target.value })}
        />
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full space-y-6">
        <ProgressBar 
          value={progress} 
          label={currentStep === 0 ? 'Getting Started' : `Step ${currentStep} of ${ONBOARDING_STEPS.length - 1}`} 
        />
        
        <main id="onboarding-content" tabIndex={-1} className="outline-none">
          <Card title={currentStepMeta?.label}>
            <div className="space-y-6">
              {renderStep()}
              
              {error && <p className="text-sm text-red-600 font-medium" role="alert">{error}</p>}

              {/* Hide global button on Welcome Step (Step 0) as it has its own 'Get Started' button */}
              {currentStep !== 0 && (
                <div className="flex gap-4 pt-2">
                  {/* Show Back button only from Step 2 onwards */}
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    onClick={isLastStep ? submitOnboarding : nextStep}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {isLastStep ? 'Complete Profile' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}