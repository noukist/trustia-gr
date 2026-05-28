-- =============================================================
-- Migration 017: Make booking_time nullable
-- =============================================================
-- The bookings table has a column `booking_time TIME NOT NULL`
-- that was added directly in the database without a migration file.
-- This column duplicates `start_time` but was never populated by
-- the application code, causing all booking inserts to fail with
-- a 23502 NOT NULL violation.
--
-- Fix: drop the NOT NULL constraint so that:
--   • "full" mode bookings that now populate booking_time still work
--   • "date" mode bookings (no time slot) also work
--   • Any existing rows with NULL booking_time are unaffected
-- =============================================================

ALTER TABLE bookings ALTER COLUMN booking_time DROP NOT NULL;
