import { signup } from './actions';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Signup Action Initialization', () => {
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: { signUp: mockSignUp },
    });
  });

  it('initializes new users with has_completed_onboarding as false', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'new_user' } }, error: null });
    
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'Password123!');
    formData.append('name', 'Test User');

    await signup(formData);

    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        data: expect.objectContaining({
          full_name: 'Test User',
          has_completed_onboarding: false
        })
      })
    }));
  });
});