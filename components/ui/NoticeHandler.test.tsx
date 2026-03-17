import { render, screen, fireEvent } from '@testing-library/react';
import { NoticeHandler } from './NoticeHandler';
import Cookies from 'js-cookie';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('@/types/notices', () => ({
  NOTICE_REGISTRY: {
    test_success: {
      title: 'Success Title',
      message: 'Success Message',
      type: 'success',
    },
    test_info: {
      title: 'Info Title',
      message: 'Info Message',
      type: 'info',
    },
    test_warning: {
      title: 'Warning Title',
      message: 'Warning Message',
      type: 'warning',
    },
    test_error: {
      title: 'Error Title',
      message: 'Error Message',
      type: 'error',
    },
  },
}));

describe('NoticeHandler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render anything if no notice cookie is present', () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    const { container } = render(<NoticeHandler />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should ignore slugs not present in the registry', () => {
    (Cookies.get as jest.Mock).mockReturnValue('malicious_slug');
    const { container } = render(<NoticeHandler />);
    
    // Pillar: Security - Ensure unknown slugs are never rendered
    expect(container).toBeEmptyDOMElement();
    expect(Cookies.remove).toHaveBeenCalledWith('next_notice', expect.any(Object));
  });

  it('should render correct content and style for a success notice (role="status")', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_success');
    
    render(<NoticeHandler />);

    // Pillar: Accessibility - Success/Info notices use role="status"
    const container = screen.getByRole('status');
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success Message')).toBeInTheDocument();

    // Pillar: Maintenance - Verify success-specific styling
    expect(container.firstChild).toHaveClass('bg-green-50');
    expect(container.querySelector('.animate-shrink')).toHaveClass('bg-green-500');
  });

  it('should render correct content and style for an error notice (role="alert")', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_error');
    
    render(<NoticeHandler />);

    // Pillar: Accessibility - Error/Warning notices use role="alert"
    const container = screen.getByRole('alert');
    expect(screen.getByText('Error Title')).toBeInTheDocument();

    // Pillar: Maintenance - Verify error-specific styling
    expect(container.firstChild).toHaveClass('bg-red-50');
    expect(container.querySelector('.animate-shrink')).toHaveClass('bg-red-500');
  });

  it('should dismiss the notice when the progress bar animation ends', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_success');
    render(<NoticeHandler />);

    // Pillar: Accessibility - Find the progress bar that is hidden from screen readers
    const progressBar = screen.getByRole('status').querySelector('.animate-shrink');
    expect(progressBar).toBeInTheDocument();

    // Functional: Manually trigger the event since JSDOM doesn't run CSS animations
    fireEvent.animationEnd(progressBar!);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should pause the timer on hover and resume on leave', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_success');
    render(<NoticeHandler />);

    const toast = screen.getByRole('status');
    const progressBar = toast.querySelector('.animate-shrink') as HTMLElement;

    // Pillar: Performance - Verify initial CSS play state
    expect(progressBar.style.animationPlayState).toBe('running');

    // Functional: Hover over the container to pause
    fireEvent.mouseEnter(toast);
    expect(progressBar.style.animationPlayState).toBe('paused');

    // Functional: Resume on mouse leave
    fireEvent.mouseLeave(toast);
    expect(progressBar.style.animationPlayState).toBe('running');
  });

  it('should immediately remove the cookie after detection (Flash Logic)', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_success');
    render(<NoticeHandler />);

    expect(Cookies.remove).toHaveBeenCalledWith('next_notice', expect.any(Object));
  });

  it('should have accessible controls', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test_success');
    render(<NoticeHandler />);
    
    const closeButton = screen.getByLabelText(/close notification/i);
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});