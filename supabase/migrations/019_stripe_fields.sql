-- =============================================================
-- 019_stripe_fields.sql
-- =============================================================
-- Adds Stripe-specific columns to the subscriptions table for
-- reconciliation between the DB and the Stripe dashboard.
--
-- Also adds 'stripe' as a valid payment_method value.
-- =============================================================

-- ── Stripe columns ────────────────────────────────────────────
-- stripe_session_id         stored immediately when checkout session is created
-- stripe_payment_intent_id  stored when checkout.session.completed webhook fires

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id          TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   TEXT NULL;

-- Optional unique index to prevent double-processing
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_session_id_unique
  ON subscriptions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- ── Extend payment_method to include 'stripe' ─────────────────
-- The existing payment_method column is TEXT (not an enum),
-- so no ALTER TYPE needed — 'stripe' is just a new string value.
-- (Verified by checking 001_complete_schema.sql: `payment_method TEXT`)
