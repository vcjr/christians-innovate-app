// Client-side Bible verse utilities with offline fallback
// Fetches verses from Supabase when online, falls back to cached JSON when offline

'use client'

import { createClient } from '@/utils/supabase/client'
import { parseBibleText } from './bible-text-parser'
import { BIBLE_TRANSLATIONS, type TranslationKey } from './bible-constants'
import {
  fetchVersesFromCache,
  fetchChapterRangeFromCache,
  isOnline,
  isTranslationCached,
} from './bible-offline'

export interface IndividualVerse {
  verseNumber: number
  chapterNumber?: number
  bookName?: string
  text: string
}

/**
 * Fetch verses individually with verse numbers (client-side with offline fallback)
 */
export async function fetchBibleVersesIndividually(
  translation: TranslationKey,
  reference: string
): Promise<{ verses: IndividualVerse[]; reference: string } | null> {
  const translationCode = BIBLE_TRANSLATIONS[translation]

  // Split by commas to handle multiple references
  const references = reference
    .split(',')
    .map((ref) => ref.trim())
    .filter((ref) => ref.length > 0)

  if (references.length > 1) {
    const allVerses: IndividualVerse[] = []

    for (const ref of references) {
      const result = await fetchSingleReference(translationCode, ref, translation)
      if (result) {
        allVerses.push(...result)
      }
    }

    if (allVerses.length === 0) {
      return null
    }

    return {
      verses: allVerses,
      reference,
    }
  }

  // Single reference
  const verses = await fetchSingleReference(translationCode, reference, translation)
  if (!verses) {
    return null
  }

  return {
    verses,
    reference,
  }
}

/**
 * Fetch a single bible reference (client-side)
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

  // Check if translation is cached - if so, prioritize local version
  const isCached = await isTranslationCached(translation)

  if (isCached) {
    console.log('Using cached translation for:', reference)

    let cachedVerses: IndividualVerse[] | null = null

    if (parsed.chapterEnd) {
      // Chapter range from cache
      cachedVerses = await fetchChapterRangeFromCache(
        translation,
        parsed.book,
        parsed.chapter,
        parsed.chapterEnd
      )
    } else {
      // Single chapter/verse from cache
      cachedVerses = await fetchVersesFromCache(
        translation,
        parsed.book,
        parsed.chapter,
        parsed.verseStart ?? undefined,
        parsed.verseEnd ?? undefined
      )
    }

    if (cachedVerses) {
      return cachedVerses.map((v) => ({
        ...v,
        text: parseBibleText(v.text, translation),
      }))
    }

    // If cache fails, fall through to online
    console.log('Cache lookup failed, trying online...')
  }

  // Try online (either no cache or cache failed)
  if (isOnline()) {
    try {
      const supabase = createClient()

      // Handle chapter range
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

        if (!error && verses && verses.length > 0) {
          return verses.map((v) => ({
            chapterNumber: v.chapter,
            verseNumber: v.verse_start,
            bookName: parsed.book,
            text: parseBibleText(v.text, translation),
          }))
        }
      } else {
        // Single chapter or verse range
        let query = supabase
          .from('bible_verses')
          .select('chapter, text, verse_start')
          .eq('translation', translationCode)
          .eq('book', parsed.book)
          .eq('chapter', parsed.chapter)
          .not('verse_start', 'is', null)
          .order('verse_start', { ascending: true })

        if (parsed.verseStart !== null) {
          query = query.gte('verse_start', parsed.verseStart)

          if (parsed.verseEnd !== null) {
            query = query.lte('verse_start', parsed.verseEnd)
          } else {
            query = query.eq('verse_start', parsed.verseStart)
          }
        }

        const { data: verses, error } = await query

        if (!error && verses && verses.length > 0) {
          return verses.map((v) => ({
            verseNumber: v.verse_start,
            chapterNumber: v.chapter,
            bookName: parsed.book,
            text: parseBibleText(v.text, translation),
          }))
        }
      }
    } catch (error) {
      console.log('Online fetch failed:', error)
    }
  }

  // Last resort: try cache if we haven't already
  if (!isCached) {
    console.log('Trying cache as final fallback for:', reference)

    if (parsed.chapterEnd) {
      const cachedVerses = await fetchChapterRangeFromCache(
        translation,
        parsed.book,
        parsed.chapter,
        parsed.chapterEnd
      )

      if (cachedVerses) {
        return cachedVerses.map((v) => ({
          ...v,
          text: parseBibleText(v.text, translation),
        }))
      }
    } else {
      const cachedVerses = await fetchVersesFromCache(
        translation,
        parsed.book,
        parsed.chapter,
        parsed.verseStart ?? undefined,
        parsed.verseEnd ?? undefined
      )

      if (cachedVerses) {
        return cachedVerses.map((v) => ({
          ...v,
          text: parseBibleText(v.text, translation),
        }))
      }
    }
  }

  return null
}

/**
 * Parse a scripture reference string into components
 */
function parseScriptureReference(reference: string): {
  book: string
  chapter: number
  verseStart: number | null
  verseEnd: number | null
  chapterEnd: number | null
} | null {
  // Remove any prefix like "Day 2: " or similar
  let cleaned = reference.trim()
  const prefixMatch = cleaned.match(/^[^:]+:\s*(.+)$/)
  if (prefixMatch && /^Day\s+\d+:/i.test(cleaned)) {
    cleaned = prefixMatch[1].trim()
  }

  // Clean up trailing dashes or special chars
  cleaned = cleaned.replace(/[-–\s]+$/, '')

  // Pattern: "Book Chapter:Verse-Verse" or "Book Chapter-Chapter" or "Book Chapter:Verse" or "Book Chapter"
  // Supports both hyphen (-) and en-dash (–)
  const pattern =
    /^(.+?)\s+(\d+)(?:\s*[-–]\s*(\d+))?(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/

  const match = cleaned.match(pattern)
  if (!match) {
    console.error('Failed to parse reference:', { original: reference, cleaned })
    return null
  }

  const book = match[1].trim()
  const chapter = parseInt(match[2], 10)
  const chapterEnd = match[3] ? parseInt(match[3], 10) : null
  const verseStart = match[4] ? parseInt(match[4], 10) : null
  const verseEnd = match[5] ? parseInt(match[5], 10) : null

  return {
    book,
    chapter,
    verseStart,
    verseEnd,
    chapterEnd,
  }
}
