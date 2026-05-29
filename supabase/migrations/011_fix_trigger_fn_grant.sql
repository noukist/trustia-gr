-- =============================================================
-- Migration 011: Revoke PUBLIC execute on trigger function
-- =============================================================
-- PostgreSQL grants EXECUTE to PUBLIC on every new function by
-- default, including trigger functions.  notify_professional_on_booking()
-- is invoked exclusively by the DB trigger (trigger_booking_notification);
-- it must never be callable directly through the REST API.
--
-- REVOKING PUBLIC removes both the anon and authenticated warnings
-- in one step, because both roles inherit from PUBLIC.
--
-- AFTER THIS MIGRATION — expected linter state:
--   notify_professional_on_booking  → no REST access  ✅
--   increment_profile_view          → anon + auth      ✅ intentional
--   increment_phone_reveal          → authenticated    ✅ intentional
--   is_admin()                      → authenticated    ✅ required by RLS
--   leaked_password                 → Pro plan         ⚠️  accepted
-- =============================================================

REVOKE EXECUTE ON FUNCTION public.notify_professional_on_booking() FROM PUBLIC;
