import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignOutButton } from './SignOutButton';
import { signOut } from '@/app/actions';
import { clearLocalSessionData } from '@/utils/auth/cleanup';

jest.mock('@/app/actions', () => ({
  signOut: jest.fn(),
}));

jest.mock('@/utils/auth/cleanup', () => ({
  clearLocalSessionData: jest.fn().mockResolvedValue(undefined),
}));

describe('SignOutButton', () => {
  it('should call cleanup then sign out action when clicked', async () => {
    render(<SignOutButton />);
    
    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    // 1. Verify cleanup is called first
    expect(clearLocalSessionData).toHaveBeenCalled();

    // 2. Verify server action is called after cleanup
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it('should be disabled while signing out', async () => {
    (clearLocalSessionData as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<SignOutButton />);
    const button = screen.getByRole('button', { name: /sign out/i });
    
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(screen.getByText(/signing out/i)).toBeInTheDocument();
  });
});
