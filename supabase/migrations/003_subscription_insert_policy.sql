-- =============================================================
-- 003_subscription_insert_policy.sql
-- =============================================================
-- Adds an RLS INSERT policy so a professional can create their
-- own subscription record during registration.
--
-- WHY this is needed:
--   001_complete_schema.sql defines only:
--     - subscriptions_read_own  (SELECT own rows)
--     - subscriptions_admin_all (ALL for admins)
--   Without an INSERT policy for regular users, the professional
--   registration wizard would be blocked from creating the trial
--   subscription record (even though the user is authenticated).
--
-- Security model:
--   A professional may only insert a subscription whose
--   professional_id matches a professionals row they own.
--   This prevents inserting subscriptions for other professionals.
-- =============================================================

CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT id
      FROM professionals
      WHERE user_id = auth.uid()
    )
  );
