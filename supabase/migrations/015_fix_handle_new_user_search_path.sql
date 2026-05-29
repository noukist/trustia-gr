-- =============================================================
-- Migration 015: Fix handle_new_user() search_path
-- =============================================================
-- Root cause: the handle_new_user() SECURITY DEFINER function
-- was created without SET search_path = public.  When Supabase
-- Auth calls the trigger it runs in a restricted search_path
-- that does NOT include the public schema, so the INSERT into
-- "customers" fails with:
--   ERROR: relation "customers" does not exist
-- This causes every new email-signup to return HTTP 500.
--
-- Fix:
--   1. Re-create the function with explicit schema-qualified
--      table references (public.customers) AND
--      SET search_path = public — belt-and-suspenders.
--   2. Add an EXCEPTION handler so that even if the customer
--      row insert somehow fails in the future, the auth user
--      creation never returns 500.  The /auth/callback route
--      already handles creating the customer row as a fallback.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (user_id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Idempotent
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block auth user creation due to a profile insert failure.
    -- The customer row will be created lazily in /auth/callback.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
