import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from './useOnboarding';
import { useProfile } from '@/hooks/useProfile';
import { useStepper } from '@/hooks/useStepper';
import { useFilePreview } from '@/hooks/useFilePreview';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { createClient } from '@/utils/supabase/client';
import { clearLocalSessionData } from '@/utils/auth/cleanup';
import Cookies from 'js-cookie';

const mockPush = jest.fn();
const mockReplace = jest.fn();

/**
 * Pillar: Maintenance
 * Mock the steps to decouple hook logic from production data.
 */
jest.mock('./onboarding', () => ({
  ONBOARDING_STEPS: [
    { id: 'welcome', label: 'Welcome', order: 0, required: false },
    { id: 'bio', label: 'Bio', order: 1, fieldName: 'bio', required: true },
    { id: 'photo', label: 'Photo', order: 2, fieldName: 'avatar_url', inputType: 'photo' },
    { 
      id: 'looking_for', 
      label: 'Looking For', 
      order: 3, 
      inputType: 'checkbox-group',
      options: [{ label: 'Partner', value: 'biz', targetField: 'looking_for_business_partner' }]
    },
  ],
}));

// Re-import after mock to get the mocked version
import { ONBOARDING_STEPS } from './onboarding';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('@/hooks/useStepper', () => ({
  useStepper: jest.fn(),
}));

jest.mock('@/hooks/useFilePreview', () => ({
  useFilePreview: jest.fn(),
}));

jest.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/auth/cleanup', () => ({
  clearLocalSessionData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('js-cookie', () => ({
  set: jest.fn(),
  remove: jest.fn(),
  get: jest.fn(),
}));

describe('useOnboarding Hook', () => {
  const mockedUseProfile = jest.mocked(useProfile);
  const mockedUseStepper = jest.mocked(useStepper);
  const mockedUseFilePreview = jest.mocked(useFilePreview);
  const mockedUseFormPersistence = jest.mocked(useFormPersistence);
  const mockedCreateClient = jest.mocked(createClient);

  const mockRefreshSession = jest.fn().mockResolvedValue({ error: null });
  const mockCompleteOnboarding = jest.fn().mockResolvedValue({ data: {}, error: null });
  const mockUpdateProfile = jest.fn();
  const mockNextStep = jest.fn();
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const mockRehydrate = jest.fn().mockResolvedValue({});
  const mockClear = jest.fn().mockResolvedValue(undefined);
  const mockClearPreview = jest.fn();
  const mockGetPreview = jest.fn();

  const mockFile = new File(['content'], 'avatar.png', { type: 'image/png' });
  const mockUserId = 'user-123';
  const mockBlobUrl = 'blob:http://localhost/mock-preview';

  let currentProfile: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pillar: Reliability - Reset state before each test
    currentProfile = { bio: '', avatar_url: null };

    // Pillar: Maintenance - Make the profile mock reactive to state updates
    mockUpdateProfile.mockImplementation((updates) => {
      Object.assign(currentProfile, updates);
    });

    mockedUseProfile.mockImplementation(() => ({
      profile: currentProfile,
      updateProfile: mockUpdateProfile,
      completeOnboarding: mockCompleteOnboarding,
      isLoading: false,
      error: null,
    }));

    mockedUseStepper.mockReturnValue({
      currentStep: 0,
      nextStep: mockNextStep,
      prevStep: jest.fn(),
      progress: 0,
      isFirstStep: true,
      isLastStep: false,
      totalSteps: 4,
      isNavigating: false,
    });

    mockedUseFilePreview.mockReturnValue({
      getPreview: mockGetPreview,
      clearPreview: mockClearPreview,
    });

    mockedUseFormPersistence.mockReturnValue({
      save: mockSave,
      rehydrate: mockRehydrate,
      clear: mockClear,
    });

    const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null });
    const mockGetPublicUrl = jest.fn().mockImplementation((path) => ({
      data: { publicUrl: `https://supabase.com/storage/v1/object/public/avatars/${path}` }
    }));

    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: mockUserId } }, error: null }),
        refreshSession: mockRefreshSession,
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    } as any);
  });

  it('should handle hydration and synchronize stepper activation', async () => {
    const { result } = renderHook(() => useOnboarding());
    
    // Pillar: Reliability - Stepper should be inactive during hydration
    expect(mockedUseStepper).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });
    
    // Stepper should become active once mounted
    expect(mockedUseStepper).toHaveBeenLastCalledWith(expect.objectContaining({ isActive: true }));
  });

  it('should initialize checkpoint from localStorage', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('2');
    
    renderHook(() => useOnboarding());
    
    // Pillar: Maintenance - Verify checkpoint is passed to the stepper
    expect(mockedUseStepper).toHaveBeenCalledWith(expect.objectContaining({
      checkpoint: 2
    }));
    
    spy.mockRestore();
  });

  it('should rehydrate data and update profile state during initialization', async () => {
    const mockSavedData = { bio: 'Valid Bio' };
    mockRehydrate.mockResolvedValue(mockSavedData);
    
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining(mockSavedData));
    });

    expect(mockRehydrate).toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith(mockSavedData);
  });

  it('should handle file updates by generating previews and saving to persistence', async () => {
    mockGetPreview.mockReturnValue(mockBlobUrl);
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      result.current.updateData({ avatar_url: mockFile });
    });

    expect(mockGetPreview).toHaveBeenCalledWith('avatar_url', mockFile);
    expect(mockUpdateProfile).toHaveBeenCalledWith({ avatar_url: mockBlobUrl });
    expect(mockSave).toHaveBeenCalledWith({ avatar_url: mockFile });
  });

  it('should map checkbox-group values to boolean fields in the profile', async () => {
    const { result } = renderHook(() => useOnboarding());
    
    await act(async () => {
      // Domain Logic: Mapping UI group 'looking_for' to DB field 'looking_for_business_partner'
      result.current.updateData({ looking_for: ['biz'] });
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
      looking_for_business_partner: true
    }));
  });

  it('should validate current step before calling nextStep', async () => {
    mockedUseStepper.mockReturnValue({ currentStep: 1 } as any); // Bio step
    currentProfile.bio = ''; // Empty required field

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      result.current.nextStep();
    });

    expect(mockNextStep).not.toHaveBeenCalled();
    expect(result.current.error).toContain('is required');
  });

  it('should perform parallel uploads and merge URLs on submission', async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const expectedUrl = `https://supabase.com/storage/v1/object/public/avatars/${mockUserId}/avatar_url.png`;
    const { result } = renderHook(() => useOnboarding());

    // Functional: Populate the state so validation passes and files are pending
    await act(async () => {
      await result.current.updateData({ avatar_url: mockFile, bio: 'Valid Bio' });
    });

    await act(async () => {
      await result.current.submitOnboarding();
    });

    // Pillar: Security - Verify path scoping includes User ID
    const storageMock = mockedCreateClient().storage.from('avatars');
    expect(storageMock.upload).toHaveBeenCalledWith(`${mockUserId}/avatar_url.png`, mockFile, expect.any(Object));

    // Pillar: Performance - Verify payload merging (Text + Cloud URLs)
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: 'Valid Bio',
        avatar_url: expectedUrl
      })
    );

    // Pillar: Security - Verify session refresh, soft purge, and success token issuance
    expect(mockRefreshSession).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalledWith('onboarding_status', 'complete');
    expect(clearLocalSessionData).toHaveBeenCalledWith({ preserveStatus: true });
    expect(mockClearPreview).toHaveBeenCalledWith('avatar_url');
    
    // Verify the one-time success authorization cookie is set
    expect(Cookies.set).toHaveBeenCalledWith('sb_success_auth', 'true', expect.objectContaining({ expires: expect.any(Number) }));

    // Pillar: UX - Verify history replacement to prevent "Back" button loops
    expect(mockReplace).toHaveBeenCalledWith('/onboarding/success');
    setItemSpy.mockRestore();
  });

  it('should update the onboarding_step cookie when moving to the next step', async () => {
    mockedUseStepper.mockReturnValue({ currentStep: 0, nextStep: mockNextStep } as any);
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      result.current.nextStep();
    });

    // Pillar: Performance - Verify server-side authority sync
    expect(Cookies.set).toHaveBeenCalledWith('onboarding_step', '0', expect.any(Object));
    expect(mockNextStep).toHaveBeenCalled();
  });
});
