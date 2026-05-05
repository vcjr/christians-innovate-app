/**
 * Pillar: Type Safety
 * Defines the visual intent and structure for system-wide notifications.
 */
export type NoticeType = 'success' | 'info' | 'warning' | 'error';

export interface NoticeConfig {
  title: string;
  message: string;
  type: NoticeType;
}

/**
 * Pillar: Security
 * Hardcoded registry prevents UI redressing or message injection via cookies.
 */
export const NOTICE_REGISTRY: Record<string, NoticeConfig> = {
  onboarding_complete: {
    title: 'Onboarding Complete',
    message: "You have already completed the onboarding process. To update your information, please visit My Profile > Settings.",
    type: 'info',
  },
  profile_updated: {
    title: 'Profile Updated',
    message: 'Your profile information has been successfully saved.',
    type: 'info',
  },
};

/** Union of valid slugs for type-safe middleware usage */
export type NoticeSlug = keyof typeof NOTICE_REGISTRY;