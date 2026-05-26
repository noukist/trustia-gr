-- =============================================================
-- Migration 012: Partial unique index — one active review per
--                (customer, professional) pair
-- =============================================================
-- Prevents a customer from leaving duplicate reviews for the same
-- professional. Soft-deleted rows (deleted_at IS NOT NULL) are
-- excluded from the constraint so a customer who deletes their
-- review can leave a new one later.
--
-- The application-level code (WriteReviewModal) uses INSERT for
-- new reviews and UPDATE for edits, so this index acts as a safety
-- net rather than the primary enforcement mechanism.
-- =============================================================

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_active_per_customer_pro
  ON reviews (customer_id, professional_id)
  WHERE deleted_at IS NULL;
