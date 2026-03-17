import { renderHook, act } from '@testing-library/react';
import { useStepper } from './useStepper';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useStepper', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: mockReplace, back: mockBack });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    
    // Mock DOM for focus management
    const el = document.createElement('div');
    el.id = 'step-container';
    document.body.appendChild(el);
    el.focus = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should initialize with step 0 by default', () => {
    const { result } = renderHook(() => useStepper({ totalSteps: 5, isActive: true }));
    expect(result.current.currentStep).toBe(0);
  });

  it('should read initial step from URL', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('step=2'));
    const { result } = renderHook(() => useStepper({ totalSteps: 5, isActive: true }));
    expect(result.current.currentStep).toBe(2);
  });

  it('should not perform any navigation logic if isActive is false', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('step=4'));
    renderHook(() => useStepper({ 
      totalSteps: 5, 
      checkpoint: 1,
      isActive: false 
    }));
    
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should navigate back using router.back', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('step=1'));
    const { result } = renderHook(() => useStepper({ totalSteps: 5, isActive: true }));
    act(() => {
      result.current.prevStep();
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('should navigate to next step and update URL', () => {
    const { result } = renderHook(() => useStepper({ totalSteps: 5, isActive: true }));
    act(() => {
      result.current.nextStep();
    });
    expect(mockPush).toHaveBeenCalledWith('?step=1');
  });

  it('should calculate progress correctly', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('step=2'));
    const { result } = renderHook(() => useStepper({ totalSteps: 5, isActive: true })); // 0, 1, 2, 3, 4
    expect(result.current.progress).toBe(50); // (2 / 4) * 100
  });

  it('should trigger guardrail redirect if step is beyond checkpoint', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('step=4'));
    renderHook(() => useStepper({ 
      totalSteps: 5, 
      checkpoint: 1,
      isActive: true,
      onGuardrailTriggered: () => mockReplace('?step=2')
    }));
    
    expect(mockReplace).toHaveBeenCalledWith('?step=2');
  });

  it('should manage focus on step change (A11y)', () => {
    const { rerender } = renderHook(({ step }) => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(`step=${step}`));
      return useStepper({ totalSteps: 5, focusTargetId: 'step-container', isActive: true });
    }, { initialProps: { step: 0 } });

    const container = document.getElementById('step-container');
    
    rerender({ step: 1 });
    
    expect(container?.focus).toHaveBeenCalled();
  });
});