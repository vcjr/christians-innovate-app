import { completeOnboardingAction } from './onboarding';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/profile-utils', () => ({
  sanitizeProfileData: jest.fn((data) => data),
}));

jest.mock('@/utils/validation', () => ({
  validateUrls: jest.fn(() => null),
}));

describe('completeOnboardingAction Atomic Sync', () => {
  const mockUpdate = jest.fn();
  const mockEq = jest.fn();
  const mockSelect = jest.fn();
  const mockSingle = jest.fn();
  const mockGetUser = jest.fn();
  const mockUpdateUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockSupabase = {
      auth: { 
        getUser: mockGetUser, 
        updateUser: mockUpdateUser 
      },
      from: jest.fn().mockReturnValue({
        update: mockUpdate.mockReturnValue({
          eq: mockEq.mockReturnValue({ 
            select: mockSelect.mockReturnValue({
              single: mockSingle.mockResolvedValue({ data: { id: 'profile_123' }, error: null })
            })
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(Promise.resolve(mockSupabase));
  });

  it('should force has_completed_onboarding to true in both DB and Auth metadata', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    
    const testData = { bio: 'Test Bio' };
    const result = await completeOnboardingAction(testData);

    // 1. Verify Database Update
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      bio: 'Test Bio',
      has_completed_onboarding: true,
    }));

    // 2. Verify Auth Metadata Update
    expect(mockUpdateUser).toHaveBeenCalledWith({ 
      data: { has_completed_onboarding: true } 
    });

    expect(result.error).toBeNull();
  });

  it('should return unauthorized if no user session is found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    
    const result = await completeOnboardingAction({});
    
    expect(result.error).toBe('Unauthorized');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should fail if the database update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null });
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({ 
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
        })
      }),
    });

    const result = await completeOnboardingAction({});
    
    expect(result.error).toBe('DB Error');
    // Should not update auth metadata if DB fails
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});