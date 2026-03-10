import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SuccessPage from './page';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Cookies from 'js-cookie';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  remove: jest.fn(),
}));

jest.mock('canvas-confetti', () => jest.fn());;

describe('Onboarding Success Page (Local State Guardrail)', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();
  const mockedUseRouter = jest.mocked(useRouter);
  const mockConfetti = confetti as jest.MockedFunction<typeof confetti>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ 
      replace: mockReplace,
      push: mockPush 
    } as any);

    // Pillar: Maintenance - Clean mock for localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        removeItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });

    // Pillar: Accessibility - Mock matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
      })),
    });
  });

  it('redirects to step 1 if onboarding_status is not "complete"', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(<SuccessPage />);
    
    await waitFor(() => {
      // Pillar: Security - Ensure unauthorized users are bounced
      expect(mockReplace).toHaveBeenCalledWith('/onboarding?step=1');
    });
  });

  it('renders the thank you message if onboarding_status is "complete"', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('complete');
    
    render(<SuccessPage />);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Thank You/i);
      // Pillar: Accessibility - Verify focus management attributes
      expect(heading).toHaveAttribute('tabIndex', '-1');
      expect(document.title).toBe("Onboarding Complete - Christians Innovate");
    });
  });

  it('triggers confetti burst with brand colors when authorized', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('complete');

    render(<SuccessPage />);

    await waitFor(() => {
      expect(mockConfetti).toHaveBeenCalledWith(expect.objectContaining({
        particleCount: expect.any(Number),
        colors: expect.arrayContaining(['#2563eb', '#16a34a', '#ffffff']),
      }));
    });
  });

  it('cleans up state and navigates to dashboard on button click', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('complete');
    render(<SuccessPage />);

    const button = screen.getByRole('button', { name: /Go to Dashboard/i });
    fireEvent.click(button);

    // Pillar: Security - Ensure access tokens are purged on exit
    expect(Cookies.remove).toHaveBeenCalledWith('sb_success_auth');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('onboarding_status');
    
    // Pillar: UX - Verify history replacement to prevent back-navigation loops
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('skips confetti if prefers-reduced-motion is enabled (A11y Pillar)', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('complete');
    (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });

    render(<SuccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Thank You/i)).toBeInTheDocument();
      expect(mockConfetti).not.toHaveBeenCalled();
    });
  });
});

    