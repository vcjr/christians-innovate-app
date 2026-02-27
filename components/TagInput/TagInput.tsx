import React from 'react';
import { useTags, Tag } from './useTags'; // Relative import
import TagItem from './TagItem'; // Relative import
import { TAG_LABELS } from './TagInputConstants'; // Relative import
import FieldLayout from '../FieldLayout/FieldLayout'; // Updated import

/**
 * @interface TagInputProps
 * @property {Tag[]} initialTags - An array of all possible tags that can be selected.
 * @property {Tag[]} selectedTags - An array of tags that are initially selected.
 * @property {(selected: Tag[]) => void} onChange - Callback function when selected tags change.
 * @property {number} [maxTags] - The maximum number of tags that can be selected.
 * @property {string} [placeholder] - Placeholder text for the input field.
 * @property {string} [label] - Label for the field layout.
 * @property {string} [id] - Optional ID for the input field.
 * @property {'blue' | 'green'} [variant] - Color scheme for the tags.
 */
interface TagInputProps {
  initialTags: Tag[];
  selectedTags: Tag[];
  onChange: (selected: Tag[]) => void;
  maxTags?: number;
  label?: string;
  id?: string;
  placeholder?: string;
  variant?: 'blue' | 'green';
}

/**
 * @function TagInput
 * @description A flexible tag input component allowing selection from predefined tags and adding custom tags.
 * @param {TagInputProps} props - The properties for the TagInput component.
 */
const TagInput: React.FC<TagInputProps> = ({
  initialTags,
  selectedTags: defaultSelectedTags, // Rename to avoid conflict with internal state
  onChange,
  maxTags,
  id,
  variant,
  label,
  placeholder = TAG_LABELS.INPUT_PLACEHOLDER,
}) => {
  const {
    selectedTags,
    availableTags,
    inputValue,
    addTag,
    removeTag,
    handleInputChange,
    handleInputKeyDown,
    error,
  } = useTags({ initialTags, defaultSelectedTags, maxTags, onChange });

  const generatedId = React.useId();
  const finalId = id || generatedId;

  return (
    <FieldLayout
      label={label}
      inputId={finalId}
      error={error}
      inputSlot={ // Pass the actual input element to inputSlot
        <input
          id={finalId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={availableTags.length > 0 ? 'true' : 'false'}
          aria-label={TAG_LABELS.INPUT_LABEL}
          aria-controls={availableTags.length > 0 ? `${finalId}-available-tags` : undefined}
        />
      }
    >
      {/* Render the rest of the TagInput UI as children of FieldLayout */}
      <div className="flex flex-col gap-3 p-3 border border-gray-200 rounded-md bg-white"> {/* This div now acts as the children */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={TAG_LABELS.SELECTED_GROUP}>
            {selectedTags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                isSelected={true}
                isRemovable={true}
                variant={variant}
                onClick={() => removeTag(tag)}
                onRemove={() => removeTag(tag)}
              />
            ))}
          </div>
        )}

        {availableTags.length > 0 && (
          <div
            className="flex flex-wrap gap-2"
            role="listbox"
            aria-labelledby={finalId}
            id={`${finalId}-available-tags`}
          >
            {availableTags.map((tag) => (
              <TagItem
                key={tag}
                tag={tag}
                isSelected={false}
                onClick={() => addTag(tag)}
              />
            ))}
          </div>
        )}
      </div>
    </FieldLayout>
  );
};

export default TagInput;