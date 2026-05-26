-- =============================================================
-- Migration 007: Profile stats counters
-- =============================================================
-- Adds profile_views and phone_reveals to the professionals table,
-- plus two SECURITY DEFINER RPC functions that allow the browser
-- to increment counters without needing direct UPDATE permission.
--
-- These are lifetime totals (not windowed). The dashboard will
-- display them with the "total" sub-label.
--
-- Apply via Supabase Dashboard → SQL Editor, or supabase db push.
-- =============================================================

-- ── 1. Add counter columns ─────────────────────────────────────

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS profile_views  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_reveals  INTEGER NOT NULL DEFAULT 0;

-- ── 2. Increment functions (SECURITY DEFINER) ──────────────────
--
-- SECURITY DEFINER means the function runs with the privileges of
-- the function owner (postgres/supabase), not the caller.
-- This lets anonymous users call rpc("increment_profile_view")
-- without having a direct UPDATE policy on professionals.
--
-- Guard: only increments non-deleted professionals.
-- SET search_path = public prevents search-path injection attacks.

CREATE OR REPLACE FUNCTION increment_profile_view(prof_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE professionals
  SET    profile_views = profile_views + 1
  WHERE  id = prof_id
    AND  deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION increment_phone_reveal(prof_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE professionals
  SET    phone_reveals = phone_reveals + 1
  WHERE  id = prof_id
    AND  deleted_at IS NULL;
END;
$$;

-- ── 3. Grant execute to all roles ─────────────────────────────
-- anon: unauthenticated visitors (profile view tracking)
-- authenticated: logged-in users (phone reveal tracking)

GRANT EXECUTE ON FUNCTION increment_profile_view(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_phone_reveal(UUID) TO anon, authenticated;
