import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagInput from './TagInput';
import { TAG_LABELS } from './TagInputConstants';

/**
 * Tests for TagInput component.
 * Enforces case-insensitive uniqueness, initialTags priority,
 * Title Case formatting for custom tags, and uses shared constants
 * for robust selector matching.
 */
describe('TagInput Component', () => {
  const initialTags = ['React', 'Next.js', 'TypeScript'];
  const defaultSelectedTags = ['React'];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with initial selected tags and available tags', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
        label="Skills"
      />
    );

    // Check for the FieldLayout label linking to the combobox (inputSlot)
    const inputElement = screen.getByLabelText('Skills');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('role', 'combobox');

    // Check selected tags
    expect(screen.getByRole('option', { name: 'React' })).toBeInTheDocument();

    // Check available tags (Next.js and TypeScript should be visible as options)
    expect(screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('Next.js') })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('TypeScript') })).toBeInTheDocument();
  });

  it('adds an available tag to selected tags when clicked', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const nextjsTag = screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('Next.js') });
    fireEvent.click(nextjsTag);

    expect(mockOnChange).toHaveBeenCalledWith(['React', 'Next.js']);
  });

  it('removes a selected tag when its remove button is clicked', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const reactRemoveButton = screen.getByRole('button', { name: TAG_LABELS.REMOVE_TAG('React') });
    fireEvent.click(reactRemoveButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('adds a custom tag when typed into the input and Enter is pressed', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(TAG_LABELS.INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'custom tag' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(['React', 'Custom Tag']);
    expect(input).toHaveValue(''); // Input should clear
  });

  it('prevents duplicate tags case-insensitively', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(TAG_LABELS.INPUT_PLACEHOLDER);
    
    // Try adding "react" (lowercase version of existing "React")
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).not.toHaveBeenCalled();
    // Verify accessibility-friendly error message
    expect(screen.getByRole('alert')).toHaveTextContent(TAG_LABELS.DUPLICATE_ERROR('react'));
  });

  it('prioritizes initialTags casing when a case-insensitive match is found', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(TAG_LABELS.INPUT_PLACEHOLDER);
    // "Next.js" is in initialTags. User types "next.js"
    fireEvent.change(input, { target: { value: 'next.js' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(['React', 'Next.js']);
  });

  it('limits the number of selected tags based on maxTags prop', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
        maxTags={2}
      />
    );

    const nextjsTag = screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('Next.js') });
    fireEvent.click(nextjsTag); // Should add Next.js

    expect(mockOnChange).toHaveBeenCalledWith(['React', 'Next.js']);
    mockOnChange.mockClear();

    const typescriptTag = screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('TypeScript') });
    fireEvent.click(typescriptTag);

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(TAG_LABELS.MAX_TAGS_ERROR(2));
  });

  it('displays the correct placeholder text', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
        placeholder="Type here..."
      />
    );
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  // Accessibility (A11y) Requirements
  it('uses a custom id when provided for input and ARIA attributes', () => {
    const customId = 'my-custom-id';
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
        id={customId}
      />
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('id', customId);
    expect(input).toHaveAttribute('aria-controls', `${customId}-available-tags`);
  });

  it('applies blue color classes when variant is "blue"', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={['React']}
        onChange={mockOnChange}
        variant="blue"
      />
    );
    const selectedTag = screen.getByRole('option', { name: 'React' });
    // Check for blue background class
    expect(selectedTag).toHaveClass('bg-blue-600');
  });

  it('applies green color classes when variant is "green"', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={['React']}
        onChange={mockOnChange}
        variant="green"
      />
    );
    const selectedTag = screen.getByRole('option', { name: 'React' });
    // Check for green background class
    expect(selectedTag).toHaveClass('bg-green-600');
  });

  it('allows removing selected tags with Backspace/Delete key', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const reactTag = screen.getByRole('option', { name: 'React' });
    fireEvent.focus(reactTag);
    fireEvent.keyDown(reactTag, { key: 'Backspace', code: 'Backspace' });

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('allows selecting available tags with Enter/Space key', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );

    const nextjsTag = screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('Next.js') });
    fireEvent.focus(nextjsTag);
    fireEvent.keyDown(nextjsTag, { key: 'Enter', code: 'Enter' });
    expect(mockOnChange).toHaveBeenCalledWith(['React', 'Next.js']);
  });

  it('has correct ARIA attributes for selected tags', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );
    const selectedTag = screen.getByRole('option', { name: 'React' });
    expect(selectedTag).toHaveAttribute('role', 'option');
    expect(selectedTag).toHaveAttribute('aria-selected', 'true');
    expect(selectedTag).toHaveAttribute('tabIndex', '0');
  });

  it('has correct ARIA attributes for available tags', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );
    const availableTag = screen.getByRole('option', { name: TAG_LABELS.SELECT_TAG('Next.js') });
    expect(availableTag).toHaveAttribute('role', 'option');
    expect(availableTag).toHaveAttribute('aria-selected', 'false');
    expect(availableTag).toHaveAttribute('tabIndex', '0');
  });

  it('input field has appropriate ARIA attributes', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const inputId = input.getAttribute('id');
    expect(inputId).toBeTruthy();
  });

  it('should not call onChange if no new tag is added (e.g., empty input)', () => {
    render(
      <TagInput
        initialTags={initialTags}
        selectedTags={defaultSelectedTags}
        onChange={mockOnChange}
      />
    );
    const input = screen.getByPlaceholderText(TAG_LABELS.INPUT_PLACEHOLDER);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});