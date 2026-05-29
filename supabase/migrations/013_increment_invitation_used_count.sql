-- =============================================================
-- Migration 013: increment_invitation_used_count RPC
-- =============================================================
-- A SECURITY DEFINER function so that a customer (who does NOT
-- own the review_invitations row) can safely increment used_count
-- after writing a review via an invite link.
--
-- WHY SECURITY DEFINER?
--   The RLS policy "invitations_manage_own" on review_invitations
--   only allows the owning professional to UPDATE the row.
--   Customers can INSERT reviews but cannot touch invitation rows.
--   A SECURITY DEFINER function executes as the function OWNER
--   (a superuser role in Supabase), bypassing RLS for that single
--   targeted UPDATE.
--
-- SAFETY GUARDS
--   1. The function only touches the used_count column — nothing else.
--   2. It only updates if used_count < max_uses (idempotent cap).
--   3. It only updates if the code exists and the caller is authenticated
--      (auth.uid() IS NOT NULL).
--   4. The function is NOT accessible to anon — GRANT is to authenticated only.
--
-- CALLED FROM
--   components/reviews/WriteReviewModal.tsx after a successful INSERT
--   into the reviews table when type = 'invitation'.
-- =============================================================

CREATE OR REPLACE FUNCTION increment_invitation_used_count(invite_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
-- Lock search_path to prevent search-path injection attacks
SET search_path = public
AS $$
BEGIN
  -- Only increment if the invitation exists, is not yet exhausted,
  -- and the caller is a signed-in user.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE review_invitations
  SET    used_count = used_count + 1
  WHERE  code       = invite_code
    AND  used_count < max_uses;

  -- If no row was found or max_uses already reached, silently do nothing.
  -- The review is already saved — we never block the user for this.
END;
$$;

-- ── Grant execute to authenticated users only ─────────────────
-- Revoke from public first to be safe, then grant to authenticated role.
REVOKE EXECUTE ON FUNCTION increment_invitation_used_count(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION increment_invitation_used_count(TEXT) TO authenticated;
