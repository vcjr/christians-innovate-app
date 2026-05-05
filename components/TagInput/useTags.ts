import { useState, useCallback, useMemo, useEffect } from 'react';
import { TAG_LABELS } from './TagInputConstants'; // Relative import

/**
 * Helper to convert a string to Title Case (capitalizing the first letter of each word).
 * @param str The string to format.
 */
const toTitleCase = (str: string): string => {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * @typedef {string} Tag
 * Represents a single tag string.
 */
export type Tag = string;

/**
 * @interface UseTagsProps
 * @property {Tag[]} initialTags - An array of all possible tags that can be selected.
 * @property {Tag[]} defaultSelectedTags - An array of tags that are initially selected.
 * @property {number} [maxTags] - The maximum number of tags that can be selected.
 * @property {(selected: Tag[]) => void} onChange - Callback function when selected tags change.
 */
interface UseTagsProps {
  initialTags: Tag[];
  defaultSelectedTags: Tag[];
  maxTags?: number;
  onChange: (selected: Tag[]) => void;
}

/**
 * @function useTags
 * @description A custom hook to manage tag selection logic.
 * @param {UseTagsProps} props - The properties for the tag management hook.
 * @returns {object} An object containing tag management state and functions.
 */
export const useTags = ({ initialTags, defaultSelectedTags, maxTags, onChange }: UseTagsProps) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() => {
    // Ensure initial selected tags respect initialTags casing
    return defaultSelectedTags.map((tag) => {
      const match = initialTags.find((t) => t.toLowerCase() === tag.toLowerCase());
      return match || tag;
    });
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const availableTags = useMemo(() => {
    const selectedLower = selectedTags.map((t) => t.toLowerCase());
    return initialTags.filter((tag) => !selectedLower.includes(tag.toLowerCase()));
  }, [initialTags, selectedTags]);

  const addTag = useCallback((tag: Tag) => {
    const sanitizedTag = tag.trim();
    if (!sanitizedTag) return;

    const normalizedInput = sanitizedTag.toLowerCase();
    
    // Check for duplicates case-insensitively
    if (selectedTags.some((t) => t.toLowerCase() === normalizedInput)) {
      setError(TAG_LABELS.DUPLICATE_ERROR(sanitizedTag));
      return;
    }

    if (maxTags && selectedTags.length >= maxTags) {
      setError(TAG_LABELS.MAX_TAGS_ERROR(maxTags));
      return;
    }

    // Priority 1: Check initialTags for casing match
    const existingMatch = initialTags.find((t) => t.toLowerCase() === normalizedInput);
    
    // Priority 2: If no match, apply Title Case to custom input
    const tagToAdd = existingMatch || toTitleCase(sanitizedTag);

    const newSelectedTags = [...selectedTags, tagToAdd];
    setSelectedTags(newSelectedTags);
    onChange(newSelectedTags);
    setError(null);
  }, [selectedTags, initialTags, maxTags, onChange]);

  const removeTag = useCallback((tagToRemove: Tag) => {
    const newSelectedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newSelectedTags);
    onChange(newSelectedTags);
    setError(null);
  }, [selectedTags, onChange]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (error) setError(null);
  }, []);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault(); // Prevent form submission
      addTag(inputValue);
      setInputValue('');
    }
  }, [inputValue, addTag]);

  return {
    selectedTags,
    availableTags,
    inputValue,
    addTag,
    removeTag,
    handleInputChange,
    handleInputKeyDown,
    error,
  };
};