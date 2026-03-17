import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from './ProgressBar';

describe('ProgressBar Component', () => {
  it('renders with the correct progressbar role', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets correct ARIA attributes based on props', () => {
    render(<ProgressBar value={30} max={200} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '30');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '200');
  });

  it('applies aria-label when label prop is provided', () => {
    render(<ProgressBar value={50} label="Onboarding progress" />);
    expect(screen.getByRole('progressbar', { name: 'Onboarding progress' })).toBeInTheDocument();
  });

  it('clamps the value to the max if provided value is higher', () => {
    render(<ProgressBar value={150} max={100} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps the value to 0 if provided value is negative', () => {
    render(<ProgressBar value={-50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  it('calculates the correct fill width percentage', () => {
    const { container } = render(<ProgressBar value={25} max={100} />);
    // The first child is the container, the second (inner) is the fill
    const fill = container.querySelector('[data-testid="progress-fill"]');
    expect(fill).toHaveStyle({ width: '25%' });
  });

  it('handles custom max values for width calculation', () => {
    const { container } = render(<ProgressBar value={5} max={10} />);
    const fill = container.querySelector('[data-testid="progress-fill"]');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('applies custom className to the container', () => {
    const { container } = render(<ProgressBar value={50} className="custom-margin" />);
    expect(container.firstChild).toHaveClass('custom-margin');
  });

  it('renders with 0% width when value is 0', () => {
    const { container } = render(<ProgressBar value={0} />);
    const fill = container.querySelector('[data-testid="progress-fill"]');
    expect(fill).toHaveStyle({ width: '0%' });
  });
});