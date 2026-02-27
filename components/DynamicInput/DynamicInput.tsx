import React from 'react';
import FieldLayout from '../FieldLayout/FieldLayout';

/**
 * @interface Option
 * @property {string} label - The display label for the option.
 * @property {string} value - The value of the option.
 */
interface Option {
  label: string;
  value: string;
}

/**
 * Base props for all DynamicInput types.
 * @interface BaseDynamicInputProps
 * @property {string} label - The label for the input field.
 * @property {string} name - The name attribute for the input field.
 * @property {string} [value] - The current value of the input.
 * @property {string} [placeholder] - Placeholder text for the input.
 * @property {string | null | undefined} [error] - An error message to display.
 * @property {(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void} onChange - Callback for input value changes.
 * @property {boolean} [disabled] - Whether the input is disabled.
 */
interface BaseDynamicInputProps {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  error?: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  disabled?: boolean;
}

/**
 * Props for text, email, password, number input types.
 * @interface InputTextProps
 * @extends BaseDynamicInputProps
 * @property {'text' | 'email' | 'password' | 'number'} type - The type of the input element.
 */
interface InputTextProps extends BaseDynamicInputProps {
  type?: 'text' | 'email' | 'password' | 'number';
}

/**
 * Props for textarea type.
 * @interface TextareaProps
 * @extends BaseDynamicInputProps
 * @property {'textarea'} type - The type of the input element.
 * @property {number} [rows] - The number of rows for the textarea.
 */
interface TextareaProps extends BaseDynamicInputProps {
  type: 'textarea';
  rows?: number;
}

/**
 * Props for select type.
 * @interface SelectProps
 * @extends BaseDynamicInputProps
 * @property {'select'} type - The type of the input element.
 * @property {Option[]} options - An array of options for the select dropdown.
 */
interface SelectProps extends BaseDynamicInputProps {
  type: 'select';
  options: Option[];
}

/**
 * Discriminated union for DynamicInput props.
 * @typedef {InputTextProps | TextareaProps | SelectProps} DynamicInputProps
 */
type DynamicInputProps = InputTextProps | TextareaProps | SelectProps;

/**
 * @function DynamicInput
 * @description A polymorphic input component that renders different HTML input elements
 *              based on the 'type' prop, providing consistent styling and accessibility.
 * @param {DynamicInputProps} props - The properties for the DynamicInput component.
 * @param {React.Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} ref - Ref forwarded to the underlying input element.
 */
const DynamicInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  DynamicInputProps
>(({ label, name, value, placeholder, error, onChange, disabled, ...rest }, ref) => {
  const commonClasses =
    'w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm';

  const renderInput = () => {
    switch (rest.type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            rows={rest.rows || 3}
            disabled={disabled}
            className={commonClasses}
            ref={ref as React.Ref<HTMLTextAreaElement>}
          />
        );
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={commonClasses}
            ref={ref as React.Ref<HTMLSelectElement>}
          >
            {rest.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      default:
        return (
          <input
            type={rest.type || 'text'}
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            disabled={disabled}
            className={commonClasses}
            ref={ref as React.Ref<HTMLInputElement>}
          />
        );
    }
  };

  return ( // Pass the rendered input to inputSlot, no children for FieldLayout
    <FieldLayout label={label} error={error} inputSlot={renderInput()}>
    </FieldLayout>
  );
});

DynamicInput.displayName = 'DynamicInput';

export default DynamicInput;