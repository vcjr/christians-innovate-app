/**
 * @function isFile
 * @description A TypeScript Type Guard to safely check if a value is an instance of File.
 * This prevents "instanceof" errors when checking union types containing primitives.
 * 
 * @param {unknown} value - The value to check.
 * @returns {value is File} - Returns true if the value is a File object.
 */
export const isFile = (value: unknown): value is File => {
  return value instanceof File;
};