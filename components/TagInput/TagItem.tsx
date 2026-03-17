import React from 'react';
import { TAG_LABELS } from './TagInputConstants'; // Relative import

/**
 * @interface TagItemProps
 * @property {string} tag - The text content of the tag.
 * @property {boolean} isSelected - True if the tag is currently selected.
 * @property {boolean} [isRemovable] - True if the tag can be removed (e.g., for selected tags).
 * @property {() => void} onClick - Callback function when the tag is clicked.
 * @property {() => void} [onRemove] - Callback function when the tag's remove action is triggered (e.g., via button or keydown).
 * @property {'blue' | 'green'} [variant] - The color scheme for the selected state.
 */
interface TagItemProps {
  tag: string;
  isSelected: boolean;
  isRemovable?: boolean;
  onClick: () => void;
  onRemove?: () => void;
  variant?: 'blue' | 'green';
}

/**
 * @function TagItem
 * @description Renders an individual tag, handling its visual state and interactions.
 * @param {TagItemProps} props - The properties for the TagItem component.
 */
const TagItem: React.FC<TagItemProps> = React.memo(({ tag, isSelected, isRemovable, onClick, onRemove, variant = 'blue' }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    } else if (isRemovable && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      onRemove?.();
    }
  };

  const variantClasses = {
    blue: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };

  const tagClasses = `
    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer
    transition-colors duration-200 ease-in-out
    ${isSelected
      ? variantClasses[variant]
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
    focus:outline-none focus:ring-2 focus:ring-opacity-50
  `;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0} // Make it focusable for keyboard navigation
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={tagClasses}
      aria-label={isSelected ? tag : TAG_LABELS.SELECT_TAG(tag)}
    >
      {tag}
      {isRemovable && isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the parent div's onClick from firing
            onRemove?.();
          }}
          className={`ml-2 -mr-1 h-4 w-4 flex items-center justify-center rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white ${
            variant === 'blue' 
              ? 'bg-blue-700 hover:bg-blue-800' 
              : 'bg-green-700 hover:bg-green-800'
          }`}
          aria-label={TAG_LABELS.REMOVE_TAG(tag)}
        >
          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default TagItem;