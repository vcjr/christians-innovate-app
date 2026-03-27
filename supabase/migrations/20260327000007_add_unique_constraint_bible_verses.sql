-- ============================================
-- ADD UNIQUE CONSTRAINT TO BIBLE_VERSES
-- Required for upsert ON CONFLICT to work
-- ============================================

ALTER TABLE public.bible_verses
  ADD CONSTRAINT bible_verses_unique_verse
  UNIQUE (translation, book, chapter, verse_start, verse_end);
