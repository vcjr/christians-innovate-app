// Shared Bible translation constants
// Can be imported by both client and server components

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
