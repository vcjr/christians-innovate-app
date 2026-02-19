import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the title inside a header when provided', () => {
    render(<Card title="Test Title">Content</Card>);
    const header = screen.getByRole('banner'); // <header> maps to banner role
    expect(header).toHaveTextContent('Test Title');
    expect(header).toHaveClass('border-b');
  });

  it('renders the footer when provided', () => {
    render(<Card footer="Test Footer">Content</Card>);
    const footer = screen.getByRole('contentinfo'); // <footer> maps to contentinfo role
    expect(footer).toHaveTextContent('Test Footer');
    expect(footer).toHaveClass('bg-gray-50');
  });

  it('does not render header or footer if props are missing', () => {
    render(<Card>Content</Card>);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('applies custom className correctly alongside base styles', () => {
    const { container } = render(<Card className="custom-layout-class">Content</Card>);
    const cardRoot = container.firstChild;
    
    // Check for custom class
    expect(cardRoot).toHaveClass('custom-layout-class');
    
    // Check for base Tailwind classes to ensure they weren't overwritten
    expect(cardRoot).toHaveClass('bg-white');
    expect(cardRoot).toHaveClass('rounded-lg');
    expect(cardRoot).toHaveClass('shadow-sm');
  });
});