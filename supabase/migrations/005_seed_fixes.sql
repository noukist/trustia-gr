-- =============================================================
-- 005_seed_fixes.sql
-- =============================================================
-- Fixes the seed professional data so the app actually works
-- end-to-end for testing.
--
-- Problems fixed:
--   1. slug = NULL       → slugs never generated for seed data
--   2. profile_complete = false → professionals invisible in search
--   3. lat/lng = NULL    → distance filter broken
--   4. booking_enabled = false → booking button always disabled
--   5. No subscriptions  → dashboard subscription tab shows error
--
-- Safe to re-run (uses ON CONFLICT DO NOTHING for inserts).
-- =============================================================


-- ── 1. Trigger slug generation ────────────────────────────────
-- The trigger fires on UPDATE OF first_name, last_name.
-- Touching the field forces it to recalculate for all seed rows.
UPDATE professionals
SET first_name = first_name
WHERE slug IS NULL OR slug = '';


-- ── 2. Mark seed professionals as complete ────────────────────
-- All 8 seed rows have first_name, last_name, phone, city filled.
-- The one inactive (Νίκος) stays inactive — good for testing
-- the "inactive pro does not appear in search" case.
UPDATE professionals
SET
  profile_complete = true,
  booking_enabled  = true
WHERE
  first_name IS NOT NULL
  AND last_name  IS NOT NULL
  AND phone      IS NOT NULL
  AND city       IS NOT NULL
  AND status     = 'active';   -- keep Νίκος (inactive) out


-- ── 3. Add Thessaloniki coordinates ──────────────────────────
-- WGS-84 centre of Thessaloniki.
-- Real per-professional coordinates would come from their
-- LocationAutocomplete selection at registration time.
UPDATE professionals
SET
  lat = 40.6401,
  lng = 22.9444
WHERE
  city = 'Θεσσαλονίκη'
  AND (lat IS NULL OR lng IS NULL);


-- ── 4. Add price_text where missing ──────────────────────────
-- Ensures the services page can display a price on each card.
UPDATE professionals SET price_text = 'Από €30/ώρα'  WHERE id = 'a1000000-0000-0000-0000-000000000001' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €10/ώρα'  WHERE id = 'a1000000-0000-0000-0000-000000000002' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €30/ώρα'  WHERE id = 'a1000000-0000-0000-0000-000000000003' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €20/συνεδρία' WHERE id = 'a1000000-0000-0000-0000-000000000004' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Κατόπιν εκτίμησης' WHERE id = 'a1000000-0000-0000-0000-000000000005' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €10/ώρα'  WHERE id = 'a1000000-0000-0000-0000-000000000006' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €8/τ.μ.'  WHERE id = 'a1000000-0000-0000-0000-000000000007' AND price_text IS NULL;
UPDATE professionals SET price_text = 'Από €50/συνεδρία' WHERE id = 'a1000000-0000-0000-0000-000000000008' AND price_text IS NULL;


-- ── 5. Create trial subscriptions for seed professionals ──────
-- Without subscriptions the dashboard subscription tab shows
-- "Δεν βρέθηκε συνδρομή".
-- We insert a 3-month trial for each active professional.
-- ON CONFLICT DO NOTHING so re-runs are safe.

INSERT INTO subscriptions (
  id,
  professional_id,
  tier,
  billing_plan,
  monthly_price,
  total_amount,
  payment_status,
  is_founding,
  starts_at,
  ends_at
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tier,
  'monthly'::billing_plan,
  CASE p.tier
    WHEN 'light'       THEN 4.00
    WHEN 'trades'      THEN 10.00
    WHEN 'specialists' THEN 18.00
  END,
  CASE p.tier
    WHEN 'light'       THEN 12.00
    WHEN 'trades'      THEN 30.00
    WHEN 'specialists' THEN 54.00
  END,
  'pending'::payment_status,
  true,   -- all seed pros are founding members
  now(),
  now() + INTERVAL '90 days'
FROM professionals p
WHERE p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.professional_id = p.id
  );


-- ── Verification queries (run these to confirm) ──────────────
-- SELECT id, slug, profile_complete, booking_enabled, lat, lng, price_text FROM professionals ORDER BY first_name;
-- SELECT professional_id, tier, billing_plan, payment_status, starts_at, ends_at FROM subscriptions;
