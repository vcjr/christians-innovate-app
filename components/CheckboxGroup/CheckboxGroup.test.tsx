import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CheckboxGroup from './CheckboxGroup';

describe('CheckboxGroup Component', () => {
  const options = [
    { label: 'Option A', value: 'a', description: 'Explanation for A' },
    { label: 'Option B', value: 'b', description: 'Explanation for B' },
  ];

  it('renders all options as checkboxes', () => {
    render(
      <CheckboxGroup 
        label="Select Options" 
        options={options} 
        value={[]} 
        onChange={() => {}} 
      />
    );
    expect(screen.getByLabelText('Option A')).toBeInTheDocument();
    expect(screen.getByLabelText('Option B')).toBeInTheDocument();
  });

  it('marks the correct checkboxes as checked based on value prop', () => {
    render(
      <CheckboxGroup 
        label="Select Options" 
        options={options} 
        value={['a']} 
        onChange={() => {}} 
      />
    );
    expect(screen.getByLabelText('Option A')).toBeChecked();
    expect(screen.getByLabelText('Option B')).not.toBeChecked();
  });

  it('calls onChange with the updated array when a checkbox is clicked', () => {
    const handleChange = jest.fn();
    render(
      <CheckboxGroup 
        label="Select Options" 
        options={options} 
        value={['a']} 
        onChange={handleChange} 
      />
    );

    // Unchecking 'a'
    fireEvent.click(screen.getByLabelText('Option A'));
    expect(handleChange).toHaveBeenCalledWith([]);

    // Checking 'b'
    fireEvent.click(screen.getByLabelText('Option B'));
    expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('renders descriptions and links them via aria-describedby', () => {
    render(
      <CheckboxGroup 
        label="Select Options" 
        options={options} 
        value={[]} 
        onChange={() => {}} 
      />
    );

    expect(screen.getByText('Explanation for A')).toBeInTheDocument();
    
    const checkbox = screen.getByLabelText('Option A');
    // Pillar: Accessibility - Description must be programmatically linked to the input
    expect(checkbox).toHaveAttribute('aria-describedby', expect.stringContaining('a-description'));
  });
});