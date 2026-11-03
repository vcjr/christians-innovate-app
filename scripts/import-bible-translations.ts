import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Book ID to Name mapping (1-66 canonical books)
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
  // Apocrypha (books 67+)
  67: 'Tobit', 68: 'Judith', 69: 'Esther (Greek)', 70: 'Wisdom of Solomon',
  71: 'Sirach', 72: 'Baruch', 73: 'Letter of Jeremiah', 74: 'Prayer of Azariah',
  75: 'Susanna', 76: 'Bel and the Dragon', 77: '1 Maccabees', 78: '2 Maccabees',
  79: '1 Esdras', 80: '2 Esdras', 81: 'Prayer of Manasseh', 82: 'Psalm 151',
  83: '3 Maccabees', 84: '4 Maccabees', 85: 'Additions to Esther', 86: 'Additions to Daniel',
  87: 'Prayer of Azariah', 88: 'Song of the Three Holy Children', 89: 'Susanna (Theodotion)'
};

interface BibleVerse {
  pk: number;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

async function importTranslation(filePath: string) {
  const fileName = path.basename(filePath, '.json');
  const translationCode = fileName.toUpperCase(); // KJV, NKJV, BSB, etc.

  console.log(`\n📖 Checking ${translationCode} from ${filePath}...`);

  // Check if translation already exists in database
  const { count } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true })
    .eq('translation', translationCode);

  if (count && count > 0) {
    console.log(`   ⏭️  Skipped: ${translationCode} already imported (${count.toLocaleString()} verses found)`);
    return { imported: 0, errors: 0, skipped: true };
  }

  console.log(`   📥 Importing ${translationCode}...`);

  // Read JSON file
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const verses: BibleVerse[] = JSON.parse(jsonData);

  console.log(`   Found ${verses.length.toLocaleString()} verses`);

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 1000;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE);

    // Transform data for our schema
    const records = batch.map(v => {
      const bookName = BOOK_NAMES[v.book] || `Book ${v.book}`;
      const reference = `${bookName} ${v.chapter}:${v.verse}`;

      return {
        translation: translationCode,
        book: bookName,
        chapter: v.chapter,
        verse_start: v.verse,
        verse_end: v.verse, // Single verse, so start = end
        reference: reference,
        text: v.text,
        bible_id: translationCode.toLowerCase(), // kjv, nkjv, bsb
      };
    });

    // Insert batch
    const { error } = await supabase
      .from('bible_verses')
      .upsert(records, {
        onConflict: 'translation,book,chapter,verse_start,verse_end',
      });

    if (error) {
      console.error(`   ❌ Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      const progress = ((i + batch.length) / verses.length * 100).toFixed(1);
      process.stdout.write(`\r   ⏳ Progress: ${progress}% (${imported.toLocaleString()} verses)`);
    }
  }

  console.log(`\n   ✅ Completed: ${imported.toLocaleString()} imported, ${errors} errors`);
  return { imported, errors };
}

async function main() {
  const translationsDir = path.join(process.cwd(), 'public', 'translations');

  console.log('🔍 Scanning translations directory...');

  // Get all JSON files in translations folder
  const files = fs.readdirSync(translationsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(translationsDir, f));

  if (files.length === 0) {
    console.log('⚠️  No JSON files found in /public/translations folder');
    return;
  }

  console.log(`📚 Found ${files.length} translation(s): ${files.map(f => path.basename(f)).join(', ')}`);

  let totalImported = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  // Import each translation
  for (const file of files) {
    const { imported, errors, skipped } = await importTranslation(file);
    totalImported += imported;
    totalErrors += errors;
    if (skipped) totalSkipped++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Import complete!`);
  console.log(`   Total verses imported: ${totalImported.toLocaleString()}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
