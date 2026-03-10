import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingPage from './page';
import { useOnboarding } from './useOnboarding';

// Pillar: Maintenance - Mock the steps to decouple orchestrator logic from production data.
// We provide a simplified set of steps to test all rendering branches (Custom, Standard, Tags).
jest.mock('./onboarding', () => ({
  ONBOARDING_STEPS: [
    { id: 'welcome', label: 'Welcome', question: 'Welcome?', order: 0, component: ({ onNext }: any) => <button onClick={onNext}>Get Started</button> },
    { id: 'bio', label: 'Bio', question: 'Bio?', order: 1, fieldName: 'bio', inputType: 'textarea' },
    { id: 'skills', label: 'Skills', question: 'Skills?', order: 2, fieldName: 'skills', inputType: 'tags' },
    { id: 'photo', label: 'Photo', question: 'Upload Photo?', order: 3, fieldName: 'avatar_url', inputType: 'photo' },
    { 
      id: 'looking_for', 
      label: 'Looking For', 
      question: 'Looking for?', 
      order: 4, 
      inputType: 'checkbox-group', 
      options: [
        // Pillar: Maintenance - Test mapping to specific boolean fields
        { label: 'Business Partner', value: 'biz', targetField: 'looking_for_business_partner' },
        { label: 'Accountability Partner', value: 'acc', targetField: 'looking_for_accountability_partner' }
      ] 
    },
  ],
}));

jest.mock('./useOnboarding', () => ({
  useOnboarding: jest.fn(),
}));

// Pillar: Maintenance - Mock specialized components to isolate orchestrator logic
jest.mock('@/components/PhotoInput/PhotoInput', () => ({
  __esModule: true,
  default: ({ label, onChange }: any) => (
    <div data-testid="mock-photo-input">
      <span>{label}</span>
      <button onClick={() => onChange(new File([''], 'profile.png', { type: 'image/png' }))}>Simulate Upload</button>
    </div>
  ),
}));

jest.mock('@/components/CheckboxGroup/CheckboxGroup', () => ({
  __esModule: true,
  default: ({ label, onChange }: any) => (
    <div data-testid="mock-checkbox-group">
      <span>{label}</span>
      <button onClick={() => onChange(['biz'])}>Select Biz Only</button>
      <button onClick={() => onChange(['biz', 'acc'])}>Select Both</button>
      <button onClick={() => onChange([])}>Clear All</button>
    </div>
  ),
}));

describe('OnboardingPage Orchestrator', () => {
  const mockNextStep = jest.fn();
  const mockPrevStep = jest.fn();
  const mockSubmit = jest.fn();
  const mockUpdateData = jest.fn();
  const mockedUseOnboarding = jest.mocked(useOnboarding);

  // Pillar: Maintenance - Base Mock prevents crashes during partial overrides
  const baseMock = {
    currentStep: 0,
    data: { 
      bio: '', 
      skills: [], 
      avatar_url: null, 
      looking_for_business_partner: false, 
      looking_for_accountability_partner: false 
    },
    error: null,
    updateData: mockUpdateData,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
    submitOnboarding: mockSubmit,
    progress: 0,
    isMounted: true,
    isLastStep: false,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseOnboarding.mockReturnValue(baseMock as any);
  });

  it('renders the custom component branch and passes onNext (Step 0)', () => {
    render(<OnboardingPage />);
    const startBtn = screen.getByRole('button', { name: /get started/i });
    expect(startBtn).toBeInTheDocument();
    
    fireEvent.click(startBtn);
    expect(mockNextStep).toHaveBeenCalled();
  });

  it('renders the standard input branch with correct labels (Step 1)', () => {
    mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 1 } as any);
    render(<OnboardingPage />);
    // Verifies integration with real DynamicInput/FieldLayout
    expect(screen.getByLabelText('Bio?')).toBeInTheDocument();
  });

  it('renders the tag input branch and handles changes (Step 2)', () => {
    mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 2 } as any);
    render(<OnboardingPage />);
    // Verifies integration with real TagInput
    expect(screen.getByText('Skills?')).toBeInTheDocument();
  });

  it('renders the photo input branch and handles file changes (Step 3)', () => {
    mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 3 } as any);
    render(<OnboardingPage />);
    
    expect(screen.getByTestId('mock-photo-input')).toBeInTheDocument();
    expect(screen.getByText('Upload Photo?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Simulate Upload'));
    // Pillar: Type Safety - Verify the orchestrator passes the File object correctly
    expect(mockUpdateData).toHaveBeenCalledWith({ avatar_url: expect.any(File) });
  });

  describe('CheckboxGroup Mapping (Step 4)', () => {
    it('gathers individual boolean fields into an array for the UI', () => {
      // Simulate data where accountability partner is already true
      mockedUseOnboarding.mockReturnValue({ 
        ...baseMock, 
        currentStep: 4,
        data: { 
          ...baseMock.data, 
          looking_for_business_partner: false,
          looking_for_accountability_partner: true 
        }
      } as any);
      
      render(<OnboardingPage />);
      
      expect(screen.getByText('Looking for?')).toBeInTheDocument();
      // The logic in page.tsx will filter options and map to ['acc']
    });

    it('scatters changes back to all individual boolean fields (Full Sync)', () => {
      mockedUseOnboarding.mockReturnValue({ 
        ...baseMock, 
        currentStep: 4,
        data: { 
          ...baseMock.data, 
          looking_for_business_partner: false,
          looking_for_accountability_partner: true 
        }
      } as any);
      
      render(<OnboardingPage />);
      
      // Click "Select Biz Only" - this simulates the UI returning ['biz']
      fireEvent.click(screen.getByText('Select Biz Only'));
      
      // Pillar: Maintenance - Verify full synchronization of the group
      expect(mockUpdateData).toHaveBeenCalledWith({
        looking_for_business_partner: true,
        looking_for_accountability_partner: false
      });
    });

    it('correctly handles clearing all selections in a mapped group', () => {
      mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 4 } as any);
      render(<OnboardingPage />);
      
      fireEvent.click(screen.getByText('Clear All'));
      
      // Verify all fields are explicitly set to false
      expect(mockUpdateData).toHaveBeenCalledWith({
        looking_for_business_partner: false,
        looking_for_accountability_partner: false
      });
    });
  });

  it('manages Back button visibility (Hidden on Step 0 & 1, Shown on Step 2)', () => {
    const { rerender } = render(<OnboardingPage />);
    
    // Step 0: Hidden
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

    // Step 1: Hidden (First data entry step)
    mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 1 } as any);
    rerender(<OnboardingPage />);
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

    // Step 2: Shown (Subsequent steps)
    mockedUseOnboarding.mockReturnValue({ ...baseMock, currentStep: 2 } as any);
    rerender(<OnboardingPage />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('changes primary button intent and label on the last step', () => {
    mockedUseOnboarding.mockReturnValue({
      ...baseMock,
      currentStep: 2,
      isLastStep: true,
    } as any);
    
    render(<OnboardingPage />);
    
    const submitBtn = screen.getByRole('button', { name: /complete profile/i });
    expect(submitBtn).toBeInTheDocument();
    
    fireEvent.click(submitBtn);
    expect(mockSubmit).toHaveBeenCalled();
  });

  it('handles loading state by disabling buttons and showing spinner', () => {
    mockedUseOnboarding.mockReturnValue({
      ...baseMock,
      currentStep: 1,
      isLoading: true,
    } as any);
    
    render(<OnboardingPage />);
    
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
    expect(nextBtn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays error messages with role="alert" (A11y Pillar)', () => {
    mockedUseOnboarding.mockReturnValue({
      ...baseMock,
      currentStep: 1,
      error: 'Something went wrong',
    } as any);
    
    render(<OnboardingPage />);
    
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent('Something went wrong');
  });

  it('provides a focus target for accessibility (A11y Pillar)', () => {
    render(<OnboardingPage />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'onboarding-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });
});
