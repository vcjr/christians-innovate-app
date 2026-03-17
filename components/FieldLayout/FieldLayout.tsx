import React from 'react';

/**
 * Props injected into the renderInput function.
 * @interface InjectedInputProps
 */
export interface InjectedInputProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  /** Tailwind classes to apply when the field is in an error state */
  errorClassName: string;
}

/**
 * @interface FieldLayoutProps
 * @property {(props: InjectedInputProps) => React.ReactNode} renderInput - A function that returns the input element, receiving accessibility and styling props.
 * @property {React.ReactNode} [children] - Additional content to render within the field's visual grouping (e.g., selected tags for a TagInput).
 * @property {string} [label] - The label text for the input field.
 * @property {string} [inputId] - The ID of the input element, used to link with the label.
 * @property {string | null | undefined} [error] - An error message to display for the field.
 * @property {boolean} [isGroup] - If true, renders as a fieldset/legend for accessibility (e.g., checkbox groups).
 */
interface FieldLayoutProps {
  renderInput: (props: InjectedInputProps) => React.ReactNode;
  children?: React.ReactNode;
  label?: string;
  inputId?: string;
  error?: string | null;
  isGroup?: boolean;
}

/**
 * @function FieldLayout
 * @description A reusable layout component for form fields, providing consistent
 *              labeling, error display, and accessibility attributes.
 * @param {FieldLayoutProps} props - The properties for the FieldLayout component.
 */
const FieldLayout: React.FC<FieldLayoutProps> = ({
  children,
  label,
  inputId,
  error,
  renderInput,
  isGroup = false,
}) => {
  const generatedId = React.useId();
  const finalId = inputId || generatedId;
  const errorId = `${finalId}-error`;

  const errorClassName = error ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : '';

  // Pillar: Maintenance/Type Safety - Polymorphic constants for semantic HTML switching.
  // Capitalizing these allows React to recognize them as components in JSX.
  const Wrapper = (isGroup ? 'fieldset' : 'div') as keyof React.JSX.IntrinsicElements;
  const LabelElement = (isGroup ? 'legend' : 'label') as keyof React.JSX.IntrinsicElements;

  return (
    <Wrapper
      className="flex flex-col gap-1"
      {...(isGroup ? {
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined
      } : {})}
    >
      {label && (
        <LabelElement
          {...(!isGroup ? { htmlFor: finalId } : {})}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </LabelElement>
      )}
      <div className="relative">
        {renderInput({
          id: finalId,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : undefined,
          errorClassName,
        })}
      </div>
      {children} {/* Render additional content here */}
      {error && (
        <p id={errorId} role="alert" className="text-red-600 text-xs font-medium">
          {error}
        </p>
      )}
    </Wrapper>
  );
};

export default FieldLayout;