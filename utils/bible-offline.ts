// Bible offline utilities
// Handles fallback to local JSON files when Supabase is unavailable

import type { IndividualVerse } from './bible-api'
import type { TranslationKey } from './bible-constants'

// Book ID to Name mapping (from import-bible-translations.ts)
const BOOK_NAMES: Record<number, string> = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi', 40: 'Matthew',
  41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts', 45: 'Romans',
  46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians', 50: 'Philippians',
  51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
  56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
  61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude',
  66: 'Revelation',
}

// Reverse mapping for book name to ID
const BOOK_NAME_TO_ID: Record<string, number> = Object.entries(BOOK_NAMES).reduce(
  (acc, [id, name]) => {
    acc[name] = parseInt(id)
    return acc
  },
  {} as Record<string, number>
)

interface BibleVerseJSON {
  pk: number
  translation: string
  book: number
  chapter: number
  verse: number
  text: string
}

/**
 * Check if a specific Bible translation is cached offline
 */
export async function isTranslationCached(translation: TranslationKey): Promise<boolean> {
  if (!('caches' in window)) return false

  try {
    const cache = await caches.open('bible-translations-v1')
    const response = await cache.match(`/translations/${translation}.json`)
    return !!response
  } catch (error) {
    console.error('Error checking cached translation:', error)
    return false
  }
}

/**
 * Get list of all cached Bible translations
 */
export async function getCachedTranslations(): Promise<TranslationKey[]> {
  if (!('caches' in window)) return []

  try {
    const cache = await caches.open('bible-translations-v1')
    const requests = await cache.keys()

    return requests
      .map(req => {
        const match = req.url.match(/\/translations\/(.+)\.json/)
        return match ? (match[1] as TranslationKey) : null
      })
      .filter(Boolean) as TranslationKey[]
  } catch (error) {
    console.error('Error getting cached translations:', error)
    return []
  }
}

/**
 * Download and cache a Bible translation for offline use
 */
export async function downloadTranslationForOffline(
  translation: TranslationKey
): Promise<{ success: boolean; error?: string }> {
  if (!('caches' in window)) {
    return { success: false, error: 'Cache API not supported' }
  }

  try {
    const cache = await caches.open('bible-translations-v1')
    const url = `/translations/${translation}.json`

    // Fetch the translation file
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch translation: ${response.statusText}`)
    }

    // Cache the response
    await cache.put(url, response)

    // Request persistent storage to prevent eviction
    if ('persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist()
      console.log('Persistent storage granted:', isPersisted)
    }

    return { success: true }
  } catch (error) {
    console.error('Error downloading translation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remove a cached Bible translation
 */
export async function removeCachedTranslation(
  translation: TranslationKey
): Promise<{ success: boolean; error?: string }> {
  if (!('caches' in window)) {
    return { success: false, error: 'Cache API not supported' }
  }

  try {
    const cache = await caches.open('bible-translations-v1')
    const url = `/translations/${translation}.json`
    const deleted = await cache.delete(url)

    return { success: deleted }
  } catch (error) {
    console.error('Error removing cached translation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get storage quota information
 */
export async function getStorageInfo(): Promise<{
  usage: number
  quota: number
  percentUsed: number
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

    return { usage, quota, percentUsed }
  } catch (error) {
    console.error('Error getting storage info:', error)
    return null
  }
}

/**
 * Fetch Bible verses from cached JSON file
 * Converts JSON structure to match Supabase API response
 */
export async function fetchVersesFromCache(
  translation: TranslationKey,
  bookName: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): Promise<IndividualVerse[] | null> {
  if (!('caches' in window)) return null

  try {
    const cache = await caches.open('bible-translations-v1')
    const response = await cache.match(`/translations/${translation}.json`)

    if (!response) {
      console.log(`Translation ${translation} not cached`)
      return null
    }

    const verses: BibleVerseJSON[] = await response.json()
    const bookId = BOOK_NAME_TO_ID[bookName]

    if (!bookId) {
      console.error(`Unknown book name: ${bookName}`)
      return null
    }

    // Filter verses matching criteria
    let filteredVerses = verses.filter(
      v => v.book === bookId && v.chapter === chapter
    )

    // Apply verse range filter if specified
    if (verseStart !== undefined) {
      if (verseEnd !== undefined) {
        filteredVerses = filteredVerses.filter(
          v => v.verse >= verseStart && v.verse <= verseEnd
        )
      } else {
        filteredVerses = filteredVerses.filter(v => v.verse === verseStart)
      }
    }

    // Convert to IndividualVerse format (matching Supabase structure)
    return filteredVerses.map(v => ({
      verseNumber: v.verse,
      chapterNumber: v.chapter,
      bookName: BOOK_NAMES[v.book],
      text: v.text,
    }))
  } catch (error) {
    console.error('Error fetching verses from cache:', error)
    return null
  }
}

/**
 * Fetch verses for a chapter range from cached JSON
 */
export async function fetchChapterRangeFromCache(
  translation: TranslationKey,
  bookName: string,
  chapterStart: number,
  chapterEnd: number
): Promise<IndividualVerse[] | null> {
  if (!('caches' in window)) return null

  try {
    const cache = await caches.open('bible-translations-v1')
    const response = await cache.match(`/translations/${translation}.json`)

    if (!response) {
      console.log(`Translation ${translation} not cached`)
      return null
    }

    const verses: BibleVerseJSON[] = await response.json()
    const bookId = BOOK_NAME_TO_ID[bookName]

    if (!bookId) {
      console.error(`Unknown book name: ${bookName}`)
      return null
    }

    // Filter verses for the chapter range
    const filteredVerses = verses.filter(
      v =>
        v.book === bookId &&
        v.chapter >= chapterStart &&
        v.chapter <= chapterEnd
    )

    // Sort by chapter, then verse
    filteredVerses.sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter
      return a.verse - b.verse
    })

    // Convert to IndividualVerse format
    return filteredVerses.map(v => ({
      verseNumber: v.verse,
      chapterNumber: v.chapter,
      bookName: BOOK_NAMES[v.book],
      text: v.text,
    }))
  } catch (error) {
    console.error('Error fetching chapter range from cache:', error)
    return null
  }
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Clear all cached Bible translations
 */
export async function clearAllBibleCache(): Promise<{ success: boolean; error?: string }> {
  if (!('caches' in window)) {
    return { success: false, error: 'Cache API not supported' }
  }

  try {
    const deleted = await caches.delete('bible-translations-v1')
    return { success: deleted }
  } catch (error) {
    console.error('Error clearing Bible cache:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
