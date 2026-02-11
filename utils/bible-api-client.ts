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
import { parseScriptureReference } from './scripture-parser'

export interface IndividualVerse {
  verseNumber: number
  chapterNumber?: number
  bookName?: string
  text: string
}

export interface BibleFetchResult {
  verses: IndividualVerse[]
  reference: string
  source: 'cache' | 'network'
}

/**
 * Fetch verses individually with verse numbers (client-side with offline fallback)
 */
export async function fetchBibleVersesIndividually(
  translation: TranslationKey,
  reference: string
): Promise<BibleFetchResult | null> {
  const translationCode = BIBLE_TRANSLATIONS[translation]

  // Split by commas to handle multiple references
  const references = reference
    .split(',')
    .map((ref) => ref.trim())
    .filter((ref) => ref.length > 0)

  if (references.length > 1) {
    const allVerses: IndividualVerse[] = []
    let usedCache = false

    for (const ref of references) {
      const result = await fetchSingleReference(translationCode, ref, translation)
      if (result) {
        allVerses.push(...result.verses)
        if (result.source === 'cache') {
          usedCache = true
        }
      }
    }

    if (allVerses.length === 0) {
      return null
    }

    return {
      verses: allVerses,
      reference,
      source: usedCache ? 'cache' : 'network',
    }
  }

  // Single reference
  const result = await fetchSingleReference(translationCode, reference, translation)
  if (!result) {
    return null
  }

  return {
    verses: result.verses,
    reference,
    source: result.source,
  }
}

/**
 * Fetch a single bible reference (client-side)
 */
async function fetchSingleReference(
  translationCode: string,
  reference: string,
  translation: TranslationKey
): Promise<{ verses: IndividualVerse[]; source: 'cache' | 'network' } | null> {
  // Parse the scripture reference
  const parsed = parseScriptureReference(reference)
  if (!parsed) {
    console.error('Failed to parse scripture reference:', reference)
    return null
  }

  // Check if translation is cached - if so, prioritize local version
  const isCached = await isTranslationCached(translation)

  if (isCached) {
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
      return {
        verses: cachedVerses.map((v) => ({
          ...v,
          text: parseBibleText(v.text, translation),
        })),
        source: 'cache',
      }
    }
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
          return {
            verses: verses.map((v) => ({
              chapterNumber: v.chapter,
              verseNumber: v.verse_start,
              bookName: parsed.book,
              text: parseBibleText(v.text, translation),
            })),
            source: 'network',
          }
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
          return {
            verses: verses.map((v) => ({
              verseNumber: v.verse_start,
              chapterNumber: v.chapter,
              bookName: parsed.book,
              text: parseBibleText(v.text, translation),
            })),
            source: 'network',
          }
        }
      }
    } catch (error) {
      // Swallow online fetch errors (e.g., network failures, 404s, timeouts)
      // and proceed to cache fallback. This ensures offline functionality works
      // seamlessly when the online database is unavailable.
    }
  }

  // Last resort: try cache if we haven't already
  if (!isCached) {

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
