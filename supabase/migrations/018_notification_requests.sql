-- =============================================================
-- 018_notification_requests.sql
-- =============================================================
-- Stores "notify me when pros arrive" requests from the zero-results
-- state on the services search page. Separate from scheduled_emails
-- (admin-only) so anonymous and authenticated visitors can INSERT.
--
-- COLUMNS
--   email        — address to notify
--   category_id  — the category slug the user searched for
--   location     — free-text location string (e.g. "Θεσσαλονίκη")
--   notified_at  — stamped by admin/cron when the email is sent
-- =============================================================

CREATE TABLE IF NOT EXISTS notification_requests (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text         NOT NULL,
  category_id  text         NOT NULL,
  location     text         NOT NULL DEFAULT '',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  notified_at  timestamptz  NULL
);

-- Lightweight uniqueness: one request per email+category+location combo.
-- Prevents double-submissions on form re-opens.
CREATE UNIQUE INDEX IF NOT EXISTS notification_requests_unique
  ON notification_requests (lower(email), category_id, lower(location));

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE notification_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can add a notification request.
-- No SELECT/UPDATE/DELETE exposed — reads are admin-only via service role.
CREATE POLICY notification_requests_insert
  ON notification_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can read and manage all rows (service role bypasses RLS anyway,
-- but this lets the Supabase dashboard work with the anon key for admins).
CREATE POLICY notification_requests_admin
  ON notification_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );
