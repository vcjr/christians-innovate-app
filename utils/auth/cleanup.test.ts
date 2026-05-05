import { clearLocalSessionData } from './cleanup';
import { clearAllPersistedFiles } from '@/utils/storage/filePersistence';
import Cookies from 'js-cookie';

jest.mock('@/utils/storage/filePersistence', () => ({
  clearAllPersistedFiles: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('js-cookie', () => ({
  remove: jest.fn(),
}));

describe('clearLocalSessionData Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should remove all keys matching application patterns (Smarter Cleanup)', async () => {
    // Setup: Mix of app data and unrelated settings
    localStorage.setItem('form_persistence_onboarding', '{"bio": "secret"}');
    localStorage.setItem('onboarding_checkpoint', '2');
    localStorage.setItem('sb-auth-token', 'jwt-token');
    localStorage.setItem('onboarding_status', 'started');
    localStorage.setItem('app_theme', 'dark'); // Should be preserved

    await clearLocalSessionData();

    // Pillar: Security - Verify PII and Auth tokens are gone
    expect(localStorage.getItem('form_persistence_onboarding')).toBeNull();
    expect(localStorage.getItem('onboarding_checkpoint')).toBeNull();
    expect(localStorage.getItem('sb-auth-token')).toBeNull();
    expect(localStorage.getItem('onboarding_status')).toBeNull();

    // Pillar: Maintenance - Verify unrelated keys are untouched
    expect(localStorage.getItem('app_theme')).toBe('dark');
  });

  it('should preserve onboarding_status and success cookie when preserveStatus is true', async () => {
    localStorage.setItem('onboarding_status', 'complete');
    localStorage.setItem('onboarding_checkpoint', '5');

    await clearLocalSessionData({ preserveStatus: true });

    // Pillar: Reliability - Verify status and auth cookie are kept to prevent redirect loops
    expect(localStorage.getItem('onboarding_status')).toBe('complete');
    expect(Cookies.remove).not.toHaveBeenCalledWith('sb_success_auth');
    
    // Pillar: Security - Verify other onboarding data is still removed
    expect(localStorage.getItem('onboarding_checkpoint')).toBeNull();
    // Pillar: UX - Resumption cookie must always be removed
    expect(Cookies.remove).toHaveBeenCalledWith('onboarding_step');
  });

  it('should perform a deep purge of binary storage and cookies', async () => {
    await clearLocalSessionData();

    // Pillar: Performance - Verify async binary purge
    expect(clearAllPersistedFiles).toHaveBeenCalled();

    // Pillar: Reliability - Verify server-side authority reset
    expect(Cookies.remove).toHaveBeenCalledWith('onboarding_step');
    expect(Cookies.remove).toHaveBeenCalledWith('sb_success_auth');
  });
});