// Bible verse utilities
// Fetches verses from local Supabase database

import { createClient } from '@/utils/supabase/server'
import { parseBibleText } from './bible-text-parser'
import { BIBLE_TRANSLATIONS, type TranslationKey } from './bible-constants'
import { parseScriptureReference } from './scripture-parser'

// Re-export for backwards compatibility
export { BIBLE_TRANSLATIONS, type TranslationKey }

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

// Export parseScriptureReference from shared utility for backwards compatibility
export { parseScriptureReference } from './scripture-parser'
