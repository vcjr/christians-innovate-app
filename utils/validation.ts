import { UserProfile } from '@/types/profile';

export const URL_FIELDS: (keyof UserProfile)[] = ['linkedin_url', 'facebook_url', 'twitter_url', 'website_url'];

/**
 * @function normalizeUrl
 * @description Trims a user-entered URL and prepends https:// when no scheme is given
 * (e.g. "example.com"). Returns null for blank input.
 */
export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * @function validateUrls
 * @description Shared helper to validate social and website URLs.
 * Moved to a utility file to avoid Next.js 'use server' constraints on synchronous exports.
 */
export function validateUrls(data: Partial<UserProfile>): string | null {
  for (const field of URL_FIELDS) {
    const val = data[field];
    const normalized = typeof val === 'string' ? normalizeUrl(val) : null;
    if (normalized) {
      try {
        // Attempt to parse as a URL; throws if invalid
        const { protocol, hostname } = new URL(normalized);
        if (!['http:', 'https:'].includes(protocol) || !hostname.includes('.')) throw new Error('Invalid URL');
      } catch (e) {
        return `Invalid URL provided for ${field}`;
      }
    }
  }
  return null;
}