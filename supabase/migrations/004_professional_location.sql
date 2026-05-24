-- =============================================================
-- 004_professional_location.sql
-- =============================================================
-- Adds WGS-84 latitude and longitude columns to the professionals
-- table so that distance-based search (PRD §74) is possible.
--
-- These coordinates are populated from Google Places when the
-- professional sets their city via LocationAutocomplete during
-- registration or profile editing.
--
-- Usage in distance search:
--   SELECT *, (haversine formula) AS distance_km
--   FROM professionals
--   WHERE distance_km <= :radius
--   ORDER BY distance_km;
--
-- When NULL: the professional's city is text-only and they will
-- NOT appear in radius-filtered results (fallback: show citycontaining the search term via ILIKE).
-- =============================================================

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6),  -- WGS-84 latitude  (-90 to 90)
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9, 6);  -- WGS-84 longitude (-180 to 180)

COMMENT ON COLUMN professionals.lat IS
  'WGS-84 latitude from Google Places. Set via LocationAutocomplete during registration/profile edit.';

COMMENT ON COLUMN professionals.lng IS
  'WGS-84 longitude from Google Places. Set via LocationAutocomplete during registration/profile edit.';
