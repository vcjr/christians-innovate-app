import React from 'react';
import FieldLayout from '../FieldLayout/FieldLayout';

interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (newValue: string[]) => void;
  error?: string | null;
}

/**
 * @function CheckboxGroup
 * @description Manages a group of checkboxes with optional descriptions.
 *              Uses FieldLayout with isGroup={true} for semantic fieldset/legend.
 */
const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, value, onChange, error }) => {
  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <FieldLayout
      label={label}
      error={error}
      isGroup={true} // Pillar: A11y - Triggers fieldset/legend rendering for groups
      renderInput={() => (
        <div className="flex flex-col gap-4 mt-2">
          {options.map((option) => {
            const isChecked = value.includes(option.value);
            const descriptionId = `${option.value}-description`;

            return (
              <div key={option.value} className="flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    id={option.value}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(option.value)}
                    aria-describedby={option.description ? descriptionId : undefined}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="text-sm leading-5">
                  <label htmlFor={option.value} className="font-medium text-gray-700 cursor-pointer">
                    {option.label}
                  </label>
                  {option.description && (
                    <p id={descriptionId} className="text-gray-500 text-xs">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    />
  );
};

export default CheckboxGroup;