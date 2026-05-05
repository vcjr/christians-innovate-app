// Bible verse utilities
// Fetches verses from local Supabase database

import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/server'
import { parseBibleText } from './bible-text-parser'
import { BIBLE_TRANSLATIONS, type TranslationKey } from './bible-constants'

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

  // Expand compound forms like "2 & 3 John" → "2 John, 3 John" before splitting
  const expanded = expandCompoundReference(reference)

  // Split by commas to handle multiple references
  const references = expanded.split(',').map(ref => ref.trim()).filter(ref => ref.length > 0)

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

// Common book name abbreviations to full canonical names (as stored in DB)
const BOOK_NAME_EXPANSIONS: Record<string, string> = {
  'Gen': 'Genesis',
  'Ex': 'Exodus', 'Exod': 'Exodus',
  'Lev': 'Leviticus',
  'Num': 'Numbers',
  'Deut': 'Deuteronomy', 'Deu': 'Deuteronomy',
  'Josh': 'Joshua', 'Jos': 'Joshua',
  'Judg': 'Judges', 'Jdg': 'Judges',
  'Sam': 'Samuel',
  '1 Sam': '1 Samuel', '2 Sam': '2 Samuel',
  '1 Kgs': '1 Kings', '2 Kgs': '2 Kings',
  '1 Chr': '1 Chronicles', '2 Chr': '2 Chronicles',
  'Neh': 'Nehemiah',
  'Est': 'Esther', 'Esth': 'Esther',
  'Ps': 'Psalms', 'Psalm': 'Psalms',
  'Prov': 'Proverbs', 'Pro': 'Proverbs',
  'Eccl': 'Ecclesiastes', 'Ecc': 'Ecclesiastes',
  'Song': 'Song of Solomon', 'SOS': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Jer': 'Jeremiah',
  'Lam': 'Lamentations',
  'Ezek': 'Ezekiel', 'Eze': 'Ezekiel',
  'Dan': 'Daniel',
  'Hos': 'Hosea',
  'Obad': 'Obadiah',
  'Mic': 'Micah',
  'Nah': 'Nahum',
  'Hab': 'Habakkuk',
  'Zeph': 'Zephaniah', 'Zep': 'Zephaniah',
  'Hag': 'Haggai',
  'Zech': 'Zechariah', 'Zec': 'Zechariah',
  'Mal': 'Malachi',
  'Matt': 'Matthew', 'Mat': 'Matthew',
  'Rom': 'Romans',
  '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians',
  'Gal': 'Galatians',
  'Eph': 'Ephesians',
  'Phil': 'Philippians', 'Php': 'Philippians',
  'Col': 'Colossians',
  '1 Thess': '1 Thessalonians', '2 Thess': '2 Thessalonians',
  '1 Thes': '1 Thessalonians', '2 Thes': '2 Thessalonians',
  '1 Tim': '1 Timothy', '2 Tim': '2 Timothy',
  'Phlm': 'Philemon', 'Phm': 'Philemon',
  'Heb': 'Hebrews',
  'Jas': 'James',
  '1 Pet': '1 Peter', '2 Pet': '2 Peter',
  '1 Jn': '1 John', '2 Jn': '2 John', '3 Jn': '3 John',
  'Rev': 'Revelation', 'Apoc': 'Revelation',
}

// Single-chapter books that may appear with no chapter number
const SINGLE_CHAPTER_BOOKS = new Set([
  'Obadiah', 'Philemon', '2 John', '3 John', 'Jude',
])

function normalizeBookName(raw: string): string {
  const trimmed = raw.trim()
  return BOOK_NAME_EXPANSIONS[trimmed] ?? trimmed
}

/**
 * Pre-process a scripture reference string, expanding compound "&" forms like
 * "2 & 3 John" into comma-separated individual references "2 John, 3 John".
 */
function expandCompoundReference(reference: string): string {
  // Match patterns like "2 & 3 John" → "2 John, 3 John"
  return reference.replace(
    /(\d+)\s*&\s*(\d+)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/g,
    (_, n1, n2, bookName) => `${n1} ${bookName}, ${n2} ${bookName}`
  )
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
      book: normalizeBookName(book),
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
      book: normalizeBookName(book),
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
      book: normalizeBookName(book),
      chapter: parseInt(chapter),
      verseStart: null,
      verseEnd: null,
    }
  }

  // Try to parse a single-chapter book with no chapter number: "Jude", "Philemon"
  match = normalizedRef.match(/^([A-Za-z0-9\s]+)$/)

  if (match) {
    const book = normalizeBookName(match[1])
    if (SINGLE_CHAPTER_BOOKS.has(book)) {
      return {
        book,
        chapter: 1,
        verseStart: null,
        verseEnd: null,
      }
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
