-- =============================================================
-- Migration 009: Revoke PUBLIC execute on increment_phone_reveal
-- =============================================================
-- PostgreSQL creates functions with EXECUTE granted to PUBLIC by default.
-- Migration 008 did `REVOKE ... FROM anon` but that only removes the
-- explicit anon grant — the implicit PUBLIC grant remains, which means
-- anon can still call the function (anon inherits from PUBLIC).
--
-- The fix is to revoke from PUBLIC entirely and keep only the
-- explicit grant to authenticated.
--
-- AFTER this migration the linter state should be:
--   increment_phone_reveal  → authenticated only       ✅
--   increment_profile_view  → anon + authenticated     ✅ intentional
--   is_admin()              → authenticated            ✅ intentional (RLS)
--   leaked_password         → Pro plan, no SQL fix     ⚠️ accepted
-- =============================================================

-- Remove the default PUBLIC grant that migration 008 did not touch.
-- anon inherits from PUBLIC, so this closes the remaining loophole.
REVOKE EXECUTE ON FUNCTION public.increment_phone_reveal(UUID) FROM PUBLIC;

-- Re-confirm authenticated still has the explicit grant (idempotent).
GRANT EXECUTE ON FUNCTION public.increment_phone_reveal(UUID) TO authenticated;
