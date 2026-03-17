import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DynamicInput from './DynamicInput';

describe('DynamicInput Component', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    label: 'Test Field',
    name: 'testField',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders an input of type text by default', () => {
    render(<DynamicInput {...defaultProps} />);
    const input = screen.getByLabelText('Test Field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders an input of type email', () => {
    render(<DynamicInput {...defaultProps} type="email" />);
    const input = screen.getByLabelText('Test Field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders an input of type password', () => {
    render(<DynamicInput {...defaultProps} type="password" />);
    const input = screen.getByLabelText('Test Field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders an input of type number', () => {
    render(<DynamicInput {...defaultProps} type="number" />);
    const input = screen.getByLabelText('Test Field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders a textarea for type="textarea"', () => {
    render(<DynamicInput {...defaultProps} type="textarea" />);
    const textarea = screen.getByLabelText('Test Field');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders a select for type="select" with options', () => {
    const options = [{ label: 'Option 1', value: '1' }];
    render(<DynamicInput {...defaultProps} type="select" options={options} />);
    const select = screen.getByLabelText('Test Field');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('passes placeholder text to the input', () => {
    render(<DynamicInput {...defaultProps} placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('calls onChange for input types', () => {
    render(<DynamicInput {...defaultProps} />);
    const input = screen.getByLabelText('Test Field');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object)); // Event object
  });

  it('calls onChange for textarea', () => {
    render(<DynamicInput {...defaultProps} type="textarea" />);
    const textarea = screen.getByLabelText('Test Field');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('calls onChange for select', () => {
    const options = [{ label: 'Option 1', value: '1' }];
    render(<DynamicInput {...defaultProps} type="select" options={options} />);
    const select = screen.getByLabelText('Test Field');
    fireEvent.change(select, { target: { value: '1' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('displays error message and applies aria-invalid state', () => {
    render(<DynamicInput {...defaultProps} error="This field is required" />);
    const input = screen.getByLabelText('Test Field');
    const errorMessage = screen.getByText('This field is required');

    expect(errorMessage).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('passes rows prop to textarea', () => {
    render(<DynamicInput {...defaultProps} type="textarea" rows={5} />);
    const textarea = screen.getByLabelText('Test Field');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('forwards ref to the underlying input element', () => {
    const ref = React.createRef<any>();
    render(<DynamicInput {...defaultProps} ref={ref} />);
    const input = screen.getByLabelText('Test Field');
    expect(ref.current).toBe(input);
  });

  it('does not render error message if error prop is null', () => {
    const { queryByText } = render(<DynamicInput {...defaultProps} error={null} />);
    expect(queryByText('Error message')).not.toBeInTheDocument();
  });
});