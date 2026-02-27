import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FieldLayout from './FieldLayout';

describe('FieldLayout Component', () => {
  it('renders children correctly', () => {
    render(<FieldLayout inputSlot={<input />}><p>Child Content</p></FieldLayout>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders a label when label prop is provided', () => {
    render(<FieldLayout label="Test Label" inputSlot={<input />} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('links label to input using htmlFor and id', () => {
    render(
      <FieldLayout label="Test Label" inputId="my-input" inputSlot={<input id="my-input" />} />
    );
    const labelElement = screen.getByText('Test Label');
    const inputElement = screen.getByLabelText('Test Label');
    expect(labelElement).toHaveAttribute('for', 'my-input');
    expect(inputElement).toHaveAttribute('id', 'my-input');
  });

  it('automatically generates and links a unique ID if inputId is not provided', () => {
    render(<FieldLayout label="Auto Label" inputSlot={<input />} />);
    
    const labelElement = screen.getByText('Auto Label') as HTMLLabelElement;
    const inputElement = screen.getByLabelText('Auto Label');
    
    // Pillar: Maintenance - We check the relationship, not the specific React ID format
    expect(inputElement.id).toBeTruthy();
    expect(labelElement.htmlFor).toBe(inputElement.id);
  });

  it('renders an error message when error prop is provided', () => {
    render(<FieldLayout error="Error message" inputSlot={<input />} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('links error message to input using aria-describedby when error is present', () => {
    render(
      <FieldLayout label="Test Label" inputId="my-input" error="Error message" inputSlot={<input id="my-input" />} />
    );
    const inputElement = screen.getByLabelText('Test Label');
    const errorMessage = screen.getByText('Error message');
    expect(inputElement).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('renders the error message with role="alert" for screen readers', () => {
    render(<FieldLayout error="Critical error" inputSlot={<input />} />);
    const errorElement = screen.getByText('Critical error');
    // Pillar: Accessibility - Ensures immediate announcement of errors
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  it('injects aria-invalid state to the child when error is present', () => {
    render(
      <FieldLayout label="Test Label" inputId="my-input" error="Error message" inputSlot={<input id="my-input" />} />
    );
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not render error message if error prop is null or undefined', () => {
    const { queryByText } = render(<FieldLayout inputSlot={<input />}><p>Child Content</p></FieldLayout>);
    expect(queryByText('Error message')).not.toBeInTheDocument();

    const { queryByText: queryByText2 } = render(<FieldLayout error={null} inputSlot={<input />} />);
    expect(queryByText2('Error message')).not.toBeInTheDocument();
  });
});