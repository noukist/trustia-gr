-- ================================================================
-- Migration: 006_bio_en_cache.sql
-- Purpose:   Add bio_en column to professionals table for caching
--            English translations of Greek bios.
-- ================================================================
-- The /api/translate route calls Google Translate API once per
-- professional and stores the result here. Subsequent requests for
-- English bios read from this column without touching the API.
--
-- RLS note: bio_en follows the same policies as `bio`:
--   - Anyone can read (SELECT)
--   - Only the professional's own user_id can update (UPDATE)
--   - The service-role key (used by the translate API route) bypasses RLS
-- ================================================================

-- Add the column (nullable — null means "not yet translated")
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS bio_en text DEFAULT NULL;

-- Index for fast lookup by id (already exists as PK, but documented here)
-- No extra index needed — we always query by id.

COMMENT ON COLUMN professionals.bio_en IS
  'Cached English translation of the bio field. Populated on-demand by '
  '/api/translate. NULL = not yet translated.';
