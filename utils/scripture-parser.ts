/**
 * Shared scripture reference parsing utility
 * Used by both client and server implementations for consistent parsing
 */

export interface ParsedReference {
  book: string
  chapter: number
  verseStart: number | null
  verseEnd: number | null
  chapterEnd?: number | null
}

/**
 * Parse a scripture reference string into its components
 * Supports formats like:
 * - "John 3:16"
 * - "Genesis 1:1-3"
 * - "Genesis 1-4"
 * - "Day 2: John 3" (prefix with number)
 * - "Week 1: Genesis 1:1-3" (prefix with number)
 * 
 * Note: Prefixes must be followed by a number (e.g., "Day 2:", not "Day:")
 */
export function parseScriptureReference(reference: string): ParsedReference | null {
  // Remove common prefixes like "Day 2:", "Week 1:", "Chapter 3:", etc.
  // Note: This only matches prefixes followed by a number
  let cleaned = reference.trim()
  const prefixMatch = cleaned.match(/^(?:Day|Week|Chapter|Lesson|Part)\s+\d+:\s*(.+)$/i)
  if (prefixMatch) {
    cleaned = prefixMatch[1].trim()
  }

  // Clean up trailing dashes or special chars
  cleaned = cleaned.replace(/[-–\s]+$/, '')

  // Normalize different dash types to regular hyphen
  const normalized = cleaned.replace(/[–—−]/g, '-')

  // Try to parse with verse numbers: "John 3:16" or "Genesis 1:1-3"
  let match = normalized.match(/^([A-Za-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/)

  if (match) {
    const [, book, chapter, verseStart, verseEnd] = match

    return {
      book: book.trim(),
      chapter: parseInt(chapter),
      verseStart: parseInt(verseStart),
      verseEnd: verseEnd ? parseInt(verseEnd) : null,
      chapterEnd: null,
    }
  }

  // Try to parse chapter range: "Genesis 1 - 4" or "Genesis 1-4"
  match = normalized.match(/^([A-Za-z0-9\s]+)\s+(\d+)\s*-\s*(\d+)$/)

  if (match) {
    const [, book, chapterStart, chapterEnd] = match

    return {
      book: book.trim(),
      chapter: parseInt(chapterStart),
      chapterEnd: parseInt(chapterEnd),
      verseStart: null,
      verseEnd: null,
    }
  }

  // Try to parse chapter only: "Genesis 1"
  match = normalized.match(/^([A-Za-z0-9\s]+)\s+(\d+)$/)

  if (match) {
    const [, book, chapter] = match

    return {
      book: book.trim(),
      chapter: parseInt(chapter),
      verseStart: null,
      verseEnd: null,
      chapterEnd: null,
    }
  }

  return null
}
