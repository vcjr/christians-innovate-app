// Script to check which Bibles your API key has access to
// Run with: npx tsx scripts/check-bible-access.ts

import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local file
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        if (key && value) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file')
  }
}

loadEnv()
const BIBLE_API_KEY = process.env.BIBLE_API_KEY

async function checkBibleAccess() {
  if (!BIBLE_API_KEY) {
    console.error('❌ BIBLE_API_KEY is not set in environment variables')
    process.exit(1)
  }

  console.log('🔍 Checking Bible access using the configured API key...\n')

  try {
    const response = await fetch('https://rest.api.bible/v1/bibles', {
      headers: {
        'api-key': BIBLE_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      console.error(`Response: ${errorText}`)
      process.exit(1)
    }

    const data = await response.json()

    console.log(`✅ Found ${data.data.length} accessible Bibles\n`)
    console.log('All Available Bibles:\n')

    // Show ALL bibles, not just English
    data.data.forEach((bible: any) => {
      console.log(`📖 ${bible.name} (${bible.language.name})`)
      console.log(`   ID: ${bible.id}`)
      console.log(`   Abbreviation: ${bible.abbreviation}`)
      console.log(`   Description: ${bible.description || 'N/A'}`)
      console.log('')
    })

    console.log('\n' + '='.repeat(60))
    console.log('English Bibles Only:')
    console.log('='.repeat(60) + '\n')

    const englishBibles = data.data.filter((bible: any) =>
      bible.language.id === 'eng' || bible.language.name === 'English'
    )

    if (englishBibles.length === 0) {
      console.log('❌ No English Bibles found')
    } else {
      englishBibles.forEach((bible: any) => {
        console.log(`📖 ${bible.name}`)
        console.log(`   ID: ${bible.id}`)
        console.log(`   Abbreviation: ${bible.abbreviation}`)
        console.log('')
      })
    }

    console.log('\nLooking for NIV, KJV, and NKJV:')

    const targetBibles = ['NIV', 'KJV', 'NKJV']
    targetBibles.forEach(abbr => {
      const found = englishBibles.find((b: any) =>
        b.abbreviation === abbr || b.name.includes(abbr)
      )
      if (found) {
        console.log(`✅ ${abbr}: ${found.id}`)
      } else {
        console.log(`❌ ${abbr}: Not found`)
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkBibleAccess()
