/**
 * @interface UserProfile
 * @description Shared domain model representing the user_profiles table in Supabase.
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  ci_updates: boolean;
  bible_year: boolean;
  skill_share: boolean;
  referral: string | null;
  skills: string[];
  interests: string[];
  looking_for_business_partner: boolean;
  looking_for_accountability_partner: boolean;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  has_completed_onboarding: boolean;
  updated_at: string;
}