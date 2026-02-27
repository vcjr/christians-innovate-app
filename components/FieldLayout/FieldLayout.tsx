import React from 'react';

/**
 * @interface FieldLayoutProps
 * @property {React.ReactElement} inputSlot - The primary interactive input element (e.g., <input>, <textarea>, <select>) to be rendered and enhanced with accessibility attributes.
 * @property {React.ReactNode} [children] - Additional content to render within the field's visual grouping (e.g., selected tags for a TagInput).
 * @property {string} [label] - The label text for the input field.
 * @property {string} [inputId] - The ID of the input element, used to link with the label.
 * @property {string | null | undefined} [error] - An error message to display for the field.
 */
interface FieldLayoutProps {
  inputSlot: React.ReactElement;
  children?: React.ReactNode;
  label?: string;
  inputId?: string;
  error?: string | null;
}

/**
 * @function FieldLayout
 * @description A reusable layout component for form fields, providing consistent
 *              labeling, error display, and accessibility attributes.
 * @param {FieldLayoutProps} props - The properties for the FieldLayout component.
 */
const FieldLayout: React.FC<FieldLayoutProps> = ({ children, label, inputId, error, inputSlot }) => {
  const generatedId = React.useId();
  const finalId = inputId || generatedId;
  const errorId = `${finalId}-error`;

  // Pillar: Accessibility - Ensure the input ID matches the label's htmlFor
  const inputWithA11yProps = React.cloneElement(inputSlot, {
    id: finalId,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
    className: `${inputSlot.props.className || ''} ${error ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : ''}`,
  });

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={finalId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {inputWithA11yProps}
      </div>
      {children} {/* Render additional content here */}
      {error && (
        <p id={errorId} role="alert" className="text-red-600 text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export default FieldLayout;