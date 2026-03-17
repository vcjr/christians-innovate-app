import { UserProfile } from '@/types/profile';

/**
 * @function sanitizeProfileData
 * @description Shared helper to trim and prepare profile data for persistence.
 * Moved to a logic file to avoid Next.js 'use server' constraints on synchronous exports.
 */
export function sanitizeProfileData(data: Partial<UserProfile>): Partial<UserProfile> {
  return {
    ...data,
    full_name: data.full_name?.trim() || null,
    bio: data.bio?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}