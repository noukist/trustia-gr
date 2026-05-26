-- =============================================================
-- Migration 014: Referrals RPC
-- =============================================================
-- Adds a SECURITY DEFINER function that lets a newly registered
-- professional claim a referral from another professional.
--
-- Why SECURITY DEFINER?
--   The `referrals` table has no INSERT policy for regular users
--   (only "referrals_read_own" SELECT + "referrals_admin" ALL).
--   Running as the definer role bypasses RLS cleanly.
--
-- Function: claim_referral(ref_slug TEXT, new_pro_id UUID)
--   1. Looks up the referrer professional by their slug.
--   2. Verifies the referrer != the new professional (no self-referral).
--   3. Checks if a referral from this referrer to this new pro exists.
--   4. Inserts a new referral row with status = 'pending'.
--   5. Returns 'ok', 'not_found', 'self_referral', or 'already_claimed'.
--
-- GRANT: authenticated users only; public is revoked.
-- =============================================================

CREATE OR REPLACE FUNCTION claim_referral(
  ref_slug    TEXT,
  new_pro_id  UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id  UUID;
  v_code         TEXT;
BEGIN
  -- 1. Resolve referrer by slug
  SELECT id INTO v_referrer_id
  FROM professionals
  WHERE slug = ref_slug
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  -- 2. Prevent self-referral
  IF v_referrer_id = new_pro_id THEN
    RETURN 'self_referral';
  END IF;

  -- 3. Prevent duplicate claim
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE referrer_id = v_referrer_id
    AND   referred_id = new_pro_id
  ) THEN
    RETURN 'already_claimed';
  END IF;

  -- 4. Generate a unique referral code
  v_code := 'REF-' || upper(substring(md5(v_referrer_id::text || new_pro_id::text || now()::text) FROM 1 FOR 8));

  -- 5. Insert referral row
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    status
  ) VALUES (
    v_referrer_id,
    new_pro_id,
    v_code,
    'pending'
  );

  RETURN 'ok';
END;
$$;

-- Security: only authenticated users may call this
REVOKE ALL ON FUNCTION claim_referral(TEXT, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION claim_referral(TEXT, UUID) TO authenticated;
