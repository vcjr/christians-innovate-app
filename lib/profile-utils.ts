import { UserProfile } from '@/types/profile';
import { URL_FIELDS, normalizeUrl } from '@/utils/validation';

/**
 * @function sanitizeProfileData
 * @description Shared helper to trim and prepare profile data for persistence.
 * Moved to a logic file to avoid Next.js 'use server' constraints on synchronous exports.
 */
export function sanitizeProfileData(data: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (data.full_name !== undefined) {
    sanitized.full_name = data.full_name?.trim() || null;
  }

  if (data.bio !== undefined) {
    sanitized.bio = data.bio?.trim() || null;
  }

  for (const field of URL_FIELDS) {
    const val = data[field];
    if (typeof val === 'string') {
      (sanitized as Record<string, unknown>)[field] = normalizeUrl(val);
    }
  }

  return sanitized;
}