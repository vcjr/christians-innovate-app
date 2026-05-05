import { renderHook, act } from '@testing-library/react';
import { useProfile } from './useProfile';
import { updateProfileAction } from '@/lib/actions/profile';

jest.mock('@/lib/actions/profile', () => ({
  updateProfileAction: jest.fn(),
}));

describe('useProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty profile data', () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.profile.bio).toBeDefined();
  });

  it('should update local state without calling server', () => {
    const { result } = renderHook(() => useProfile());
    
    act(() => {
      result.current.updateProfile({ bio: 'New Bio' });
    });

    expect(result.current.profile.bio).toBe('New Bio');
    expect(updateProfileAction).not.toHaveBeenCalled();
  });

  it('should call updateProfileAction when saveProfile is invoked', async () => {
    (updateProfileAction as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useProfile());

    await act(async () => {
      await result.current.saveProfile({ bio: 'Saved Bio' });
    });

    expect(updateProfileAction).toHaveBeenCalledWith({ bio: 'Saved Bio' });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle server errors gracefully', async () => {
    (updateProfileAction as jest.Mock).mockResolvedValue({ error: 'Server Error' });
    const { result } = renderHook(() => useProfile());

    await act(async () => {
      await result.current.saveProfile({ bio: 'Error Bio' });
    });

    expect(result.current.error).toBe('Server Error');
  });
});