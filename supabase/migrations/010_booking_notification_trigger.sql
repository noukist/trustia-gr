-- =============================================================
-- Migration 010: Auto-notify professional on new booking
-- =============================================================
-- Creates a SECURITY DEFINER trigger function that fires AFTER
-- every INSERT on bookings and inserts an in-app notification
-- for the receiving professional.
--
-- WHY A TRIGGER
--   The notification insert requires bypassing RLS (there is no
--   INSERT policy for regular users on notifications).  A trigger
--   runs with the privileges of the DB owner so no service-role
--   key or extra RPC is needed.
--
-- NOTIFICATION CONTENT (Greek — default app language)
--   title: "📅 Νέα αίτηση κράτησης"
--   body:  "<customer_name> ζητά ραντεβού για DD/MM/YYYY"
--   link:  "/dashboard?tab=bookings"
--   channel: 'inbox'
--
-- FUTURE EMAIL
--   When a Resend API key is added, the Next.js API route at
--   /api/notify-booking can be extended to also send an email
--   using the professional's email address.
-- =============================================================

-- ── Trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_professional_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pro_user_id      UUID;
  customer_display TEXT;
BEGIN
  -- ── 1. Resolve the professional's auth.users id ─────────────
  SELECT user_id
    INTO pro_user_id
    FROM professionals
   WHERE id = NEW.professional_id;

  -- If professional not found (should never happen due to FK), skip
  IF pro_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ── 2. Best display name for the customer ───────────────────
  -- Priority: booking override name > customers.display_name > fallback
  SELECT COALESCE(
    NULLIF(TRIM(NEW.customer_name), ''),
    c.display_name,
    'Κάποιος πελάτης'
  )
    INTO customer_display
    FROM customers c
   WHERE c.id = NEW.customer_id;

  -- ── 3. Insert the in-app notification ───────────────────────
  INSERT INTO notifications (user_id, title, body, link, channel)
  VALUES (
    pro_user_id,
    '📅 Νέα αίτηση κράτησης',
    customer_display
      || ' ζητά ραντεβού για '
      || to_char(NEW.booking_date, 'DD/MM/YYYY'),
    '/dashboard?tab=bookings',
    'inbox'
  );

  RETURN NEW;
END;
$$;

-- ── Attach trigger to bookings ────────────────────────────────
-- Drop first so re-running the migration is safe (idempotent).

DROP TRIGGER IF EXISTS trigger_booking_notification ON bookings;

CREATE TRIGGER trigger_booking_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_professional_on_booking();
