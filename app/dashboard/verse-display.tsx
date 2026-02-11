'use client'

import { useState, useEffect } from 'react'
import { getBibleVersesIndividually } from './verse-actions'
import { getUserPreferredTranslation, saveUserPreferredTranslation } from './user-preferences-actions'
import type { TranslationKey } from '@/utils/bible-api'
import type { IndividualVerse, BibleFetchResult } from '@/utils/bible-api-client'
import { fetchBibleVersesIndividually } from '@/utils/bible-api-client'
import { parseBibleText } from '@/utils/bible-text-parser'
import { BookOpen, Loader2, ChevronDown, List, AlignLeft, WifiOff } from 'lucide-react'

interface VerseDisplayProps {
  reference: string
  translation?: TranslationKey
  truncate?: boolean
  maxLength?: number
  showVersionSelector?: boolean
  showViewModeToggle?: boolean
  defaultViewMode?: 'paragraph' | 'verse-by-verse'
  usePreferredTranslation?: boolean
}

interface VerseByVerseViewProps {
  reference: string
  verses: IndividualVerse[]
  selectedVersion: TranslationKey
}

interface ParagraphViewProps {
  reference: string
  verses: IndividualVerse[]
  selectedVersion: TranslationKey
}

const AVAILABLE_VERSIONS: { value: TranslationKey; label: string }[] = [
  { value: 'KJV', label: 'KJV - King James Version' },
  { value: 'NKJV', label: 'NKJV - New King James Version' },
  { value: 'ESV', label: 'ESV - English Standard Version' },
  { value: 'NIV', label: 'NIV - New International Version' },
  { value: 'NLT', label: 'NLT - New Living Translation' },
  { value: 'NASB', label: 'NASB - New American Standard Bible' },
  { value: 'MSG', label: 'MSG - The Message' },
]

// Helper function to render text with HTML line breaks
function renderTextWithBreaks(text: string) {
  // Split by <br>, <br/>, or </br> tags
  const parts = text.split(/(<br\s*\/?>|<\/br>)/gi)

  return parts.map((part, idx) => {
    // If it's a br tag, render actual line break
    if (part.match(/^<br\s*\/?>|<\/br>$/i)) {
      return <br key={idx} />
    }
    // Otherwise render the text
    return part
  })
}

function VerseByVerseView({ reference, verses, selectedVersion }: VerseByVerseViewProps) {
  if (verses.length === 0) {
    return (
      <div className="py-4 px-4 sm:px-6 bg-blue-50 border-l-4 border-blue-500 rounded">
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm italic">No verses available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 px-4 sm:px-6 bg-blue-50 border-l-4 border-blue-500 rounded">
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-blue-700 font-semibold mb-3">
            {reference}
          </p>
          <div className="space-y-3">
            {verses.map((verse, idx) => {
              // if the verse.versenumber is null dont render it
              if (verse.verseNumber === null) return null

              // Check if this is the start of a new book
              const isNewBook = verse.bookName &&
                (idx === 0 || verse.bookName !== verses[idx - 1].bookName)

              // Check if this is the start of a new chapter
              const isNewChapter = verse.chapterNumber &&
                (idx === 0 || verse.chapterNumber !== verses[idx - 1].chapterNumber)

              return (
                <div key={`${verse.bookName || ''}-${verse.chapterNumber || 1}-${verse.verseNumber}`}>
                  {isNewBook && verse.bookName && (
                    <div className="font-bold text-blue-800 text-xl mt-8 first:mt-0 mb-4 pb-2 border-b-2 border-blue-300">
                      {verse.bookName}
                    </div>
                  )}
                  {isNewChapter && verse.chapterNumber && !isNewBook && (
                    <div className="font-bold text-blue-700 text-lg mt-6 first:mt-0 mb-3">
                      Chapter {verse.chapterNumber}
                    </div>
                  )}
                  {isNewChapter && verse.chapterNumber && isNewBook && (
                    <div className="font-semibold text-blue-700 text-base mb-3">
                      Chapter {verse.chapterNumber}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <span className="text-sm font-bold text-blue-700 flex-shrink-0 select-none">
                      {verse.verseNumber}
                    </span>
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                      {renderTextWithBreaks(verse.text)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs sm:text-sm text-blue-600 font-medium mt-3">
            ({selectedVersion})
          </p>
        </div>
      </div>
    </div>
  )
}

function ParagraphView({ reference, verses, selectedVersion }: ParagraphViewProps) {
  if (verses.length === 0) {
    return (
      <div className="py-4 px-4 sm:px-6 bg-blue-50 border-l-4 border-blue-500 rounded">
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm italic">No verses available</span>
        </div>
      </div>
    )
  }

  // Group verses by book and chapter
  const bookChapterGroups = new Map<string, Map<number, IndividualVerse[]>>()
  verses.forEach(verse => {
    const book = verse.bookName || 'Unknown'
    const chapter = verse.chapterNumber || 1

    if (!bookChapterGroups.has(book)) {
      bookChapterGroups.set(book, new Map())
    }
    const chapterMap = bookChapterGroups.get(book)!
    if (!chapterMap.has(chapter)) {
      chapterMap.set(chapter, [])
    }
    chapterMap.get(chapter)!.push(verse)
  })

  return (
    <div className="space-y-6">
      {Array.from(bookChapterGroups.entries()).map(([bookName, chapterMap]) => (
        <div key={bookName}>
          {bookChapterGroups.size > 1 && (
            <div className="font-bold text-blue-800 text-xl mb-4 pb-2 border-b-2 border-blue-300">
              {bookName}
            </div>
          )}
          {Array.from(chapterMap.entries()).map(([chapterNum, chapterVerses]) => {
            // Combine all verse texts for this chapter
            const combinedText = chapterVerses.map(v => v.text).join(' ')

            // Split into paragraphs (every 3-4 sentences)
            const sentences = combinedText.match(/[^.!?]+[.!?]+/g) || [combinedText]
            const paragraphs: string[] = []
            let currentParagraph = ''

            sentences.forEach((sentence, idx) => {
              currentParagraph += sentence
              // Create a new paragraph every 3-4 sentences
              if ((idx + 1) % 4 === 0 || currentParagraph.length > 250) {
                paragraphs.push(currentParagraph.trim())
                currentParagraph = ''
              }
            })

            // Add remaining text as final paragraph
            if (currentParagraph.trim()) {
              paragraphs.push(currentParagraph.trim())
            }

            return (
              <div key={chapterNum} className="py-4 px-4 sm:px-6 bg-blue-50 border-l-4 border-blue-500 rounded mb-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-blue-700 text-lg mb-3">
                      Chapter {chapterNum}
                    </div>
                    <div className="text-sm sm:text-base text-gray-800 leading-relaxed space-y-4">
                      {paragraphs.map((para, pIdx) => (
                        <p key={pIdx}>{renderTextWithBreaks(para)}</p>
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-600 font-medium mt-3">
                      ({selectedVersion})
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function VerseDisplay({
  reference,
  translation: initialTranslation = 'NLT',
  truncate = false,
  maxLength = 150,
  showVersionSelector = false,
  showViewModeToggle = false,
  defaultViewMode = 'verse-by-verse',
  usePreferredTranslation = false
}: VerseDisplayProps) {
  const [individualVerses, setIndividualVerses] = useState<IndividualVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<TranslationKey>(initialTranslation)
  const [viewMode, setViewMode] = useState<'paragraph' | 'verse-by-verse'>(defaultViewMode)
  const [isOffline, setIsOffline] = useState(false)

  // Load user's preferred translation on mount
  useEffect(() => {
    async function loadPreferredTranslation() {
      if (usePreferredTranslation) {
        const preferredTranslation = await getUserPreferredTranslation()
        setSelectedVersion(preferredTranslation)
      }
    }
    loadPreferredTranslation()
  }, [usePreferredTranslation])

  // Handle translation change and save preference
  const handleTranslationChange = async (newTranslation: TranslationKey) => {
    setSelectedVersion(newTranslation)
    if (usePreferredTranslation) {
      await saveUserPreferredTranslation(newTranslation)
    }
  }

  useEffect(() => {
    async function loadVerses() {
      setLoading(true)
      setError(false)

      try {
        // Use client-side fetch with offline fallback
        const individualResult = await fetchBibleVersesIndividually(selectedVersion, reference)

        if (individualResult) {
          setIndividualVerses(individualResult.verses)
          // Set offline based on whether data came from cache
          setIsOffline(individualResult.source === 'cache')
        } else {
          setIndividualVerses([])
          setError(true)
        }
      } catch (err) {
        console.error('Error loading verses:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadVerses()
  }, [reference, selectedVersion, truncate])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading verse...</span>
      </div>
    )
  }

  // For truncated view, use plain text
  if (truncate) {
    if (individualVerses.length === 0) {
      return (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm italic">Verse not available</span>
        </div>
      )
    }

    const combinedText = individualVerses.map(v => v.text).join(' ')
    const displayText = combinedText.length > maxLength
      ? combinedText.substring(0, maxLength) + '...'
      : combinedText

    return (
      <div className="py-4 px-4 sm:px-6 bg-blue-50 border-l-4 border-blue-500 rounded">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed mb-2">
              {displayText}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-blue-700 font-medium">
                {reference} ({selectedVersion})
              </p>
              {isOffline && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || individualVerses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm italic">Verse not available</span>
      </div>
    )
  }

  // For full view, display each verse separately with optional version selector
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {showVersionSelector && (
          <div className="flex items-center gap-2">
            <label htmlFor="version-select" className="text-sm font-medium text-gray-700">
              Bible Version:
            </label>
            <div className="relative">
              <select
                id="version-select"
                value={selectedVersion}
                onChange={(e) => handleTranslationChange(e.target.value as TranslationKey)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                {AVAILABLE_VERSIONS.map((version) => (
                  <option key={version.value} value={version.value}>
                    {version.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}

        {isOffline && (
          <div className="flex items-center gap-2 ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode</span>
          </div>
        )}

        {showViewModeToggle && individualVerses.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setViewMode('paragraph')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'paragraph'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <AlignLeft className="h-4 w-4" />
                Paragraph
              </button>
              <button
                onClick={() => setViewMode('verse-by-verse')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'verse-by-verse'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <List className="h-4 w-4" />
                By Verse
              </button>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'verse-by-verse' && individualVerses.length > 0 ? (
        <VerseByVerseView
          reference={reference}
          verses={individualVerses}
          selectedVersion={selectedVersion}
        />
      ) : (
        <ParagraphView
          reference={reference}
          verses={individualVerses}
          selectedVersion={selectedVersion}
        />
      )}
    </div>
  )
}
