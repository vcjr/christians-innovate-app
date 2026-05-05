import React from 'react';
import { UserProfile } from '@/types/profile';

export interface OnboardingStep {
  id: string;
  label: string;
  question: string;
  description?: string;
  order: number;
  fieldName?: keyof UserProfile;
  inputType?: 'text' | 'url' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'tags' | 'photo' | 'checkbox-group';
  required?: boolean;
  component?: React.ComponentType<any>;
  options?: { label: string; value: string; description?: string; targetField?: keyof UserProfile }[];
  initialTags?: string[];
  variant?: 'blue' | 'green';
}

/**
 * Centralized step configuration.
 * Used for navigation logic, progress calculation, and guardrails.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { 
    id: 'welcome', 
    label: 'Getting Started',
    question: 'Welcome to Christians Innovate!', 
    order: 0,
    // Custom component for the welcome screen
    component: React.lazy(() => import('@/app/onboarding/WelcomeStep'))
  },
  { 
    id: 'bio', 
    label: 'Personal Info',
    question: 'Tell us about yourself', 
    order: 1,
    fieldName: 'bio',
    inputType: 'textarea',
    required: false
  },
  { 
    id: 'photo',
    label: 'Profile Photo',
    question: 'Upload a profile photo',
    order: 2,
    fieldName: 'avatar_url',
    inputType: 'photo',
    required: false
  },
  { 
    id: 'skills', 
    label: 'Expertise',
    question: 'What are your top skills?', 
    order: 3,
    fieldName: 'skills',
    inputType: 'tags',
    required: false,
    initialTags: ['Software Engineering', 'Architecture', 'TypeScript', 'Next.js'],
    variant: 'blue'
  },
  {
    id: 'interests',
    label: 'Interests',
    question: 'What activities, hobbies, or topics are you interested in?',
    order: 4,
    fieldName: 'interests',
    inputType: 'tags',
    required: false,
    variant: 'green'
  },
  {
    id: 'looking_for',
    label: 'Looking For',
    question: 'What are you looking for in this community?',
    order: 5,
    inputType: 'checkbox-group',
    required: false,
    options: [
      // Pillar: Maintenance - Map UI options directly to database boolean fields
      { label: 'Business Partner', value: 'biz', targetField: 'looking_for_business_partner', description: 'I am looking for someone to build a venture with.' },
      { label: 'Accountability Partner', value: 'acc', targetField: 'looking_for_accountability_partner', description: 'I am looking for someone to stay consistent in my faith and work.' },
    ]
  },
  {
    id: 'linkedIn',
    label: 'LinkedIn',
    question: 'Share your LinkedIn profile URL (optional)',
    order: 6,
    fieldName: 'linkedin_url',
    inputType: 'url',
    required: false
  },
  {
    id: 'facebook',
    label: 'Facebook',
    question: 'Share your Facebook profile URL (optional)',
    order: 7,
    fieldName: 'facebook_url',
    inputType: 'url',
    required: false
  },
  {
    id: 'twitter',
    label: 'Twitter',
    question: 'Share your Twitter profile URL (optional)',
    order: 8,
    fieldName: 'twitter_url',
    inputType: 'url',
    required: false
  },
  {
    id: 'personalWebsite',
    label: 'Personal Website',
    question: 'Do you have a personal website or portfolio? (optional)',
    order: 9,
    fieldName: 'website_url',
    inputType: 'url',
    required: false
  },
];