-- =============================================================
-- 020_contact_messages.sql
-- =============================================================
-- Stores inbound contact form submissions from /contact.
-- Visible to admins only; anonymous visitors can INSERT.
-- =============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text        NOT NULL DEFAULT '',
  message    text        NOT NULL,
  locale     text        NOT NULL DEFAULT 'el',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at    timestamptz NULL
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY contact_messages_insert
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read / manage
CREATE POLICY contact_messages_admin
  ON contact_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );
