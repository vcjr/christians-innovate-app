# Bible Translation Import

This directory contains Bible translations in JSON format that will be:
1. Imported into the Supabase database for server-side Bible verse lookups
2. Cached by the PWA service worker for offline Bible reading

## Supported Format

Each JSON file should contain an array of verse objects:

```json
[
  {
    "pk": 1,
    "translation": "KJV",
    "book": 1,
    "chapter": 1,
    "verse": 1,
    "text": "In the beginning God created the heaven and the earth."
  },
  ...
]
```

## Adding New Translations

1. Download the translation JSON file (e.g., `NKJV.json`, `BSB.json`)
2. Place it in this `/public/translations` folder
3. The filename (without `.json`) will be used as the translation code

## Importing Translations

Run the import script:

```bash
npm run import:bibles
```

The script will:
- Automatically detect all `.json` files in this folder
- Import each translation into the `bible_verses` table
- Show progress and statistics
- Handle duplicates (will update existing verses)

## Current Translations

- **KJV** - King James Version
- **NKJV** - New King James Version
- **ESV** - English Standard Version
- **NIV** - New International Version
- **NLT** - New Living Translation
- **NASB** - New American Standard Bible
- **MSG** - The Message

## Offline Usage

These JSON files are served via the Next.js public folder and can be downloaded for offline use through the PWA. Users can manage offline Bible downloads in the Settings page.

## Environment Variables Required

Make sure these are set in your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for bulk imports)
