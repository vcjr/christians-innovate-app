/** 
 * Shared constants for TagInput component to ensure consistency between
 * implementation and testing (Maintenance & Accessibility pillars).
 */
export const TAG_LABELS = {
  SELECTED_GROUP: 'Selected tags',
  INPUT_LABEL: 'Add new tag',
  INPUT_PLACEHOLDER: 'Add new tag...',
  REMOVE_TAG: (tag: string) => `Remove ${tag} tag`,
  SELECT_TAG: (tag: string) => `Select ${tag} from available tags`,
  DUPLICATE_ERROR: (tag: string) => `'${tag}' is already selected.`,
  MAX_TAGS_ERROR: (max: number) => `Maximum of ${max} tags reached.`,
} as const;