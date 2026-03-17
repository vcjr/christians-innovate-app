import { UserProfile } from '@/types/profile';

/**
 * @function validateUrls
 * @description Shared helper to validate social and website URLs.
 * Moved to a utility file to avoid Next.js 'use server' constraints on synchronous exports.
 */
export function validateUrls(data: Partial<UserProfile>): string | null {
  const urlFields: (keyof UserProfile)[] = ['linkedin_url', 'facebook_url', 'twitter_url', 'website_url'];
  for (const field of urlFields) {
    const val = data[field];
    if (typeof val === 'string' && val.length > 0) {
      try {
        // Attempt to parse as a URL; throws if invalid
        new URL(val);
      } catch (e) {
        return `Invalid URL provided for ${field}`;
      }
    }
  }
  return null;
}