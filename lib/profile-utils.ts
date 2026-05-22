import { UserProfile } from '@/types/profile';

/**
 * @function sanitizeProfileData
 * @description Shared helper to trim and prepare profile data for persistence.
 * Moved to a logic file to avoid Next.js 'use server' constraints on synchronous exports.
 */
export function sanitizeProfileData(data: Partial<UserProfile>): Partial<UserProfile> {
  const trimmedName = data.full_name?.trim();

  const result: Partial<UserProfile> = {
    ...data,
    // Only write full_name when a non-empty value was provided.
    // An empty/missing value is omitted so the DB retains whatever
    // was already there (e.g. set by the handle_new_user trigger).
    full_name: trimmedName || undefined,
    bio: data.bio?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Remove the key entirely when undefined so PostgREST doesn't null it out
  if (!result.full_name) {
    delete result.full_name;
  }

  return result;
}