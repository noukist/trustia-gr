-- =============================================================
-- Migration 008: Fix RPC execute grants
-- =============================================================
-- Addresses Supabase security linter warnings after migration 007.
--
-- CHANGES
--   1. Revoke anon EXECUTE on increment_phone_reveal
--      Phone reveals require the user to be authenticated —
--      ActionPanel.tsx only reveals the phone to signed-in users.
--      The original 007 grant was overly broad.
--
--   2. Revoke all public EXECUTE on rls_auto_enable()
--      This is an internal schema-setup utility, never meant to
--      be callable through the PostgREST API by end users.
--
-- NON-CHANGES (intentional, left as-is)
--   • increment_profile_view → anon + authenticated keep EXECUTE.
--     Anonymous page views must be counted; the SECURITY DEFINER
--     guard (deleted_at IS NULL) prevents abuse beyond inflating
--     a counter on a valid professional's row.
--
--   • is_admin() → authenticated keeps EXECUTE.
--     Revoking breaks RLS policies that call is_admin() in their
--     WHERE clause — PostgreSQL requires the calling role to hold
--     EXECUTE even for functions invoked inside a policy.
--     The function only returns a boolean for the caller's own
--     user_id, so there is no privilege escalation risk.
--
-- REMAINING ACTION (cannot be fixed in SQL)
--   Enable HaveIBeenPwned leaked-password protection:
--   Supabase Dashboard → Authentication → Security → toggle on.
-- =============================================================

-- ── 1. Phone reveals: remove anon access ─────────────────────
-- anon users cannot reveal a professional's phone number in the UI;
-- only authenticated (logged-in) users can. Remove the over-broad grant.

REVOKE EXECUTE ON FUNCTION public.increment_phone_reveal(UUID) FROM anon;

-- Confirm authenticated still has access (safe to re-grant idempotently)
GRANT EXECUTE ON FUNCTION public.increment_phone_reveal(UUID) TO authenticated;

-- ── 2. rls_auto_enable: revoke from all API-accessible roles ──
-- This utility function was used during initial schema setup.
-- End users must never call it through the REST API.

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
