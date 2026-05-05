import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FieldLayout from './FieldLayout';

describe('FieldLayout Component', () => {
  it('renders children correctly', () => {
    render(
      <FieldLayout renderInput={(props) => <input {...props} />}>
        <p>Child Content</p>
      </FieldLayout>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders a label when label prop is provided', () => {
    render(<FieldLayout label="Test Label" renderInput={(props) => <input {...props} />} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('links label to input using htmlFor and id', () => {
    render(
      <FieldLayout
        label="Test Label"
        inputId="my-input"
        renderInput={(props) => <input {...props} />}
      />
    );
    const labelElement = screen.getByText('Test Label');
    const inputElement = screen.getByLabelText('Test Label');
    expect(labelElement).toHaveAttribute('for', 'my-input');
    expect(inputElement).toHaveAttribute('id', 'my-input');
  });

  it('automatically generates and links a unique ID if inputId is not provided', () => {
    render(<FieldLayout label="Auto Label" renderInput={(props) => <input {...props} />} />);
    
    const labelElement = screen.getByText('Auto Label') as HTMLLabelElement;
    const inputElement = screen.getByLabelText('Auto Label');
    
    // Pillar: Maintenance - We check the relationship, not the specific React ID format
    expect(inputElement.id).toBeTruthy();
    expect(labelElement.htmlFor).toBe(inputElement.id);
  });

  it('renders an error message when error prop is provided', () => {
    render(<FieldLayout error="Error message" renderInput={(props) => <input {...props} />} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('links error message to input using aria-describedby when error is present', () => {
    render(
      <FieldLayout
        label="Test Label"
        error="Error message"
        renderInput={(props) => <input {...props} />}
      />
    );
    const inputElement = screen.getByLabelText('Test Label');
    const errorMessage = screen.getByText('Error message');
    expect(inputElement).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('renders the error message with role="alert" for screen readers', () => {
    render(<FieldLayout error="Critical error" renderInput={(props) => <input {...props} />} />);
    const errorElement = screen.getByText('Critical error');
    // Pillar: Accessibility - Ensures immediate announcement of errors
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  it('passes aria-invalid state to the render function when error is present', () => {
    render(
      <FieldLayout
        label="Test Label"
        error="Error message"
        renderInput={(props) => <input {...props} />}
      />
    );
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('provides error styling classes via errorClassName when error is present', () => {
    render(
      <FieldLayout
        error="Error"
        renderInput={({ errorClassName }) => (
          <input data-testid="styled-input" className={errorClassName} />
        )}
      />
    );
    const input = screen.getByTestId('styled-input');
    expect(input).toHaveClass('border-red-600');
    expect(input).toHaveClass('focus:ring-red-600');
  });

  it('does not render error message if error prop is null or undefined', () => {
    const { queryByText } = render(
      <FieldLayout renderInput={(props) => <input {...props} />}>
        <p>Child Content</p>
      </FieldLayout>
    );
    expect(queryByText('Error message')).not.toBeInTheDocument();
  });

  it('renders as a fieldset and legend when isGroup is true', () => {
    render(
      <FieldLayout label="Group Label" isGroup={true} renderInput={() => <div />}>
        <input type="checkbox" aria-label="Option 1" />
      </FieldLayout>
    );
    
    // Pillar: Accessibility - Checkboxes in a group must be wrapped in a fieldset
    const fieldset = screen.getByRole('group');
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(screen.getByText('Group Label').tagName).toBe('LEGEND');
  });

  it('applies group-level accessibility attributes when isGroup is true', () => {
    render(
      <FieldLayout label="Group Label" isGroup={true} error="Group Error" renderInput={() => <div />}>
        <input type="checkbox" aria-label="Option 1" />
      </FieldLayout>
    );

    const fieldset = screen.getByRole('group');
    const error = screen.getByText('Group Error');
    
    // Pillar: Accessibility - Errors should be linked to the fieldset container for groups
    expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    expect(fieldset).toHaveAttribute('aria-describedby', error.id);
  });
});