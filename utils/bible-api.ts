// Bible verse utilities
// Fetches verses from local Supabase database

import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/server'
import { parseBibleText } from './bible-text-parser'

// Supported Bible translations (currently imported in database)
export const BIBLE_TRANSLATIONS = {
  KJV: 'KJV', // King James Version
  NKJV: 'NKJV', // New King James Version
  ESV: 'ESV', // English Standard Version
  NIV: 'NIV', // New International Version
  NLT: 'NLT', // New Living Translation
  NASB: 'NASB', // New American Standard Bible
  MSG: 'MSG', // The Message
} as const

export type TranslationKey = keyof typeof BIBLE_TRANSLATIONS

export interface IndividualVerse {
  verseNumber: number
  chapterNumber?: number
  bookName?: string
  text: string
}

/**
 * Fetch verses individually with verse numbers (for verse-by-verse display)
 * Supports multiple references separated by commas (e.g., "Psalm 8, Proverbs 1")
 * @param translation - Translation key (e.g., 'KJV')
 * @param reference - Bible reference (e.g., 'John 3:16' or 'Psalm 8, Proverbs 1')
 * @returns Array of individual verses with their numbers
 */
export async function fetchBibleVersesIndividually(
  translation: TranslationKey,
  reference: string
): Promise<{ verses: IndividualVerse[]; reference: string } | null> {
  const translationCode = BIBLE_TRANSLATIONS[translation]

  // Split by commas to handle multiple references
  const references = reference.split(',').map(ref => ref.trim()).filter(ref => ref.length > 0)

  console.log('Processing references:', references)

  // If multiple references, fetch each and combine
  if (references.length > 1) {
    const allVerses: IndividualVerse[] = []

    for (const ref of references) {
      console.log('Fetching reference:', ref)
      const result = await fetchSingleReference(translationCode, ref, translation)
      console.log('Result for', ref, ':', result ? `${result.length} verses` : 'null')
      if (result) {
        allVerses.push(...result)
      }
    }

    console.log('Total verses fetched:', allVerses.length)

    if (allVerses.length === 0) {
      return null
    }

    return {
      verses: allVerses,
      reference
    }
  }

  // Single reference
  const verses = await fetchSingleReference(translationCode, reference, translation)
  if (!verses) {
    return null
  }

  return {
    verses,
    reference
  }
}

/**
 * Fetch a single bible reference
 */
async function fetchSingleReference(
  translationCode: string,
  reference: string,
  translation: TranslationKey
): Promise<IndividualVerse[] | null> {
  // Parse the scripture reference
  const parsed = parseScriptureReference(reference)
  if (!parsed) {
    console.error('Failed to parse scripture reference:', reference)
    return null
  }

  try {
    const supabase = await createClient()

    // Handle chapter range (e.g., "Genesis 1-4")
    if (parsed.chapterEnd) {
      const { data: verses, error } = await supabase
        .from('bible_verses')
        .select('chapter, verse_start, text')
        .eq('translation', translationCode)
        .eq('book', parsed.book)
        .gte('chapter', parsed.chapter)
        .lte('chapter', parsed.chapterEnd)
        .not('verse_start', 'is', null)
        .order('chapter', { ascending: true })
        .order('verse_start', { ascending: true })

      if (error) {
        console.error('Database error fetching verses:', error)
        return null
      }

      if (!verses || verses.length === 0) {
        console.error('No verses found for reference:', reference)
        return null
      }

      // Parse each verse individually with chapter numbers
      return verses.map(v => ({
        chapterNumber: v.chapter,
        verseNumber: v.verse_start,
        bookName: parsed.book,
        text: parseBibleText(v.text, translation)
      }))
    }

    // Build query for single chapter or verse range
    let query = supabase
      .from('bible_verses')
      .select('chapter, text, verse_start')
      .eq('translation', translationCode)
      .eq('book', parsed.book)
      .eq('chapter', parsed.chapter)
      .not('verse_start', 'is', null)
      .order('verse_start', { ascending: true })

    // Filter by verse range if specified
    if (parsed.verseStart !== null) {
      query = query.gte('verse_start', parsed.verseStart)

      if (parsed.verseEnd !== null) {
        query = query.lte('verse_start', parsed.verseEnd)
      } else {
        query = query.eq('verse_start', parsed.verseStart)
      }
    }

    const { data: verses, error } = await query

    if (error) {
      console.error('Database error fetching verses:', error)
      return null
    }

    if (!verses || verses.length === 0) {
      console.error('No verses found for reference:', reference)
      return null
    }

    // Parse each verse individually
    return verses.map(v => ({
      chapterNumber: v.chapter,
      verseNumber: v.verse_start,
      bookName: parsed.book,
      text: parseBibleText(v.text, translation)
    }))
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching Bible verses individually:', error.message)
    } else {
      console.error('Error fetching Bible verses individually:', error)
    }
    return null
  }
}

/**
 * Parse a scripture reference to extract book, chapter, and verses
 */
export function parseScriptureReference(reference: string): {
  book: string
  chapter: number
  chapterEnd?: number
  verseStart: number | null
  verseEnd: number | null
} | null {
  // Normalize different dash types to regular hyphen
  const normalizedRef = reference.replace(/[–—−]/g, '-')

  // Try to parse with verse numbers: "John 3:16" or "Genesis 1:1-3"
  let match = normalizedRef.match(/^([A-Za-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/)

  if (match) {
    const [, book, chapter, verseStart, verseEnd] = match

    return {
      book: book.trim(),
      chapter: parseInt(chapter),
      verseStart: parseInt(verseStart),
      verseEnd: verseEnd ? parseInt(verseEnd) : null,
    }
  }

  // Try to parse chapter range: "Genesis 1 - 4" or "Genesis 1-4"
  match = normalizedRef.match(/^([A-Za-z0-9\s]+)\s+(\d+)\s*-\s*(\d+)$/)

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
  match = normalizedRef.match(/^([A-Za-z0-9\s]+)\s+(\d+)$/)

  if (match) {
    const [, book, chapter] = match

    return {
      book: book.trim(),
      chapter: parseInt(chapter),
      verseStart: null,
      verseEnd: null,
    }
  }

  return null
}

/**
 * Fetch plain-text verse snippets for a batch of scripture references.
 * Designed for server-side email sending (uses service client, bypasses RLS).
 * Returns a Map keyed by the original reference string.
 *
 * @param references  - Array of unique scripture reference strings
 * @param translation - Bible translation to use (default: KJV)
 * @param maxVerses   - Max verses to include per reference (default: 3)
 */
export async function fetchVerseSnippetsForEmail(
  references: string[],
  translation: TranslationKey = 'KJV',
  maxVerses = 3
): Promise<Map<string, string>> {
  const snippetMap = new Map<string, string>()
  const uniqueRefs = [...new Set(references.filter(Boolean))]

  if (uniqueRefs.length === 0) return snippetMap

  const supabase = createServiceClient()
  const translationCode = BIBLE_TRANSLATIONS[translation]

  for (const reference of uniqueRefs) {
    const parsed = parseScriptureReference(reference)
    if (!parsed) {
      console.warn('[fetchVerseSnippetsForEmail] Could not parse reference:', reference)
      snippetMap.set(reference, reference)
      continue
    }

    try {
      let query = supabase
        .from('bible_verses')
        .select('verse_start, text')
        .eq('translation', translationCode)
        .eq('book', parsed.book)
        .eq('chapter', parsed.chapter)
        .not('verse_start', 'is', null)
        .order('verse_start', { ascending: true })
        .limit(maxVerses)

      if (parsed.verseStart !== null) {
        query = query.gte('verse_start', parsed.verseStart)
        if (parsed.verseEnd !== null) {
          query = query.lte('verse_start', parsed.verseEnd)
        }
      }

      const { data: verses, error } = await query

      if (error || !verses || verses.length === 0) {
        console.warn('[fetchVerseSnippetsForEmail] No verses found for:', reference)
        snippetMap.set(reference, reference) // fall back to the reference string
        continue
      }

      // Join cleaned verse texts into a single readable snippet
      const combined = verses
        .map((v) => parseBibleText(v.text, translation))
        .join(' ')
        .trim()

      // Truncate at ≈200 chars at a word boundary
      const snippet =
        combined.length <= 200
          ? combined
          : combined.slice(0, 200).replace(/\s+\S*$/, '') + '\u2026'

      snippetMap.set(reference, snippet)
    } catch (err) {
      console.error('[fetchVerseSnippetsForEmail] Error for reference:', reference, err)
      snippetMap.set(reference, reference)
    }
  }

  return snippetMap
}
