import { updateProfileAction } from './profile';
import { createClient } from '@/utils/supabase/server';
import { validateUrls } from '@/utils/validation';
import { sanitizeProfileData } from '@/lib/profile-utils';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/validation', () => ({
  validateUrls: jest.fn(() => null),
}));

jest.mock('@/lib/profile-utils', () => ({
  sanitizeProfileData: jest.fn((data) => ({ ...data, _sanitized: true, updated_at: 'mock-date' })),
}));

describe('updateProfileAction Dual-Sync', () => {
  const mockUpdate = jest.fn();
  const mockEq = jest.fn();
  const mockSelect = jest.fn();
  const mockSingle = jest.fn();
  const mockGetUser = jest.fn();
  const mockUpdateUser = jest.fn();

  const mockedCreateClient = jest.mocked(createClient);
  const mockedValidateUrls = jest.mocked(validateUrls);
  const mockedSanitize = jest.mocked(sanitizeProfileData);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 1. Setup the complex Supabase mock chain
    const mockSupabase: any = {
      auth: { 
        getUser: mockGetUser, 
        updateUser: mockUpdateUser 
      },
      from: jest.fn().mockReturnValue({
        update: mockUpdate.mockReturnValue({
          eq: mockEq.mockReturnValue({ 
            select: mockSelect.mockReturnValue({
              single: mockSingle.mockResolvedValue({ data: {}, error: null })
            })
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('returns unauthorized if no user is found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    
    const result = await updateProfileAction({ full_name: 'New Name' });
    
    expect(result).toEqual({ data: null, error: 'Unauthorized' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should call supabase update and sync auth metadata when onboarding is complete (Dual-Sync)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    
    const testData = { 
      bio: 'Clean Bio', 
      full_name: 'John Doe',
      has_completed_onboarding: true 
    };

    // Pillar: Maintenance - Actually call the function being tested
    await updateProfileAction(testData);

    // Verify Database Update
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      bio: 'Clean Bio',
      full_name: 'John Doe',
      // Note: updated_at is added by sanitizeProfileData
      updated_at: 'mock-date'
    }));

    // Verify the Auth Metadata Sync
    expect(mockUpdateUser).toHaveBeenCalledWith({ 
      data: expect.objectContaining({ has_completed_onboarding: true }) 
    });
  });

  it('should return error for invalid URLs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null });
    (validateUrls as jest.Mock).mockReturnValueOnce('Invalid URL provided');
    
    const result = await updateProfileAction({ website_url: 'not-a-url' });
    
    expect(result.error).toContain('Invalid URL');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
