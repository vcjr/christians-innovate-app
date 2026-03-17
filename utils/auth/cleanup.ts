import { clearAllPersistedFiles } from '@/utils/storage/filePersistence';
import Cookies from 'js-cookie';

export interface CleanupOptions {
  /** If true, the onboarding_status key will be preserved in localStorage */
  preserveStatus?: boolean;
  /** Optional callback to reset local React states after storage is cleared */
  onClear?: () => void;
}

/**
 * @function clearLocalSessionData
 * @description Performs a pattern-based wipe of application data from the browser.
 * Pillar: Security/Scalability - Automatically removes all form drafts, checkpoints, and auth tokens.
 * 
 * @param options Configuration for the cleanup process.
 */
export const clearLocalSessionData = async (
  options: CleanupOptions = {}
) => {
  // 1. Pattern-based localStorage cleanup (Pillar: Scalability)
  const patterns = ['form_persistence_', 'onboarding_', 'sb-'];
  Object.keys(localStorage).forEach((key) => {
    // Pillar: Security - Preserve status token for the success page if requested
    if (options.preserveStatus && key === 'onboarding_status') return;

    if (patterns.some((pattern) => key.startsWith(pattern))) {
      localStorage.removeItem(key);
    }
  });
  
  // 2. Clear binary data and cookies (Pillar: Security)
  try {
    await clearAllPersistedFiles();
    Cookies.remove('onboarding_step');
    Cookies.remove('next_notice');
    // Pillar: Reliability - Preserve success auth cookie during soft purge to prevent redirect loops
    if (!options.preserveStatus) {
      Cookies.remove('sb_success_auth');
    }
  } catch (err) {
    console.error('Failed to clear binary storage during auth cleanup:', err);
  }

  // Pillar: Maintenance - Execute callback if provided in options
  if (options.onClear) options.onClear();
};
