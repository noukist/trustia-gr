-- =============================================================
-- 016_simplify_announcements.sql
-- =============================================================
-- Announcements no longer have a time window.
-- An announcement is live from creation until deletion.
-- Drop the unused scheduling columns and reset active to TRUE
-- for any rows that may have been accidentally deactivated.
-- =============================================================

ALTER TABLE announcements
  DROP COLUMN IF EXISTS starts_at,
  DROP COLUMN IF EXISTS ends_at;

-- Ensure all remaining announcements are active
-- (soft-deactivated rows are treated as deleted under the new model)
UPDATE announcements SET active = true WHERE active = false;
