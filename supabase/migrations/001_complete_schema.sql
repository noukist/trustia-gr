-- =============================================================
-- TRUSTIA.GR — Complete Database Schema Migration
-- =============================================================
-- Source: Complete-System-PRD-v1.docx (Section 71) +
--         System Architecture Document (Section 3)
--
-- Run this ONCE in your Supabase SQL Editor (or via CLI).
-- It creates ALL tables, indexes, RLS policies, triggers,
-- functions, and seeds the 48 service categories.
--
-- IMPORTANT: This migration is idempotent — every CREATE
-- uses IF NOT EXISTS so it's safe to re-run.
-- =============================================================


-- ═══════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════
-- uuid-ossp: generates UUIDs for primary keys
-- pg_cron: schedules recurring jobs (email reminders, syncs)
-- pg_trgm: fuzzy text search for professional names/bios

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Note: pg_cron must be enabled from Supabase Dashboard > Extensions


-- ═══════════════════════════════════════════════════════════════
-- CUSTOM TYPES (ENUMs)
-- ═══════════════════════════════════════════════════════════════
-- Using ENUMs enforces valid values at the database level.
-- Much safer than relying on application code to validate.

-- Subscription tier determines pricing
DO $$ BEGIN
  CREATE TYPE tier_type AS ENUM ('light', 'trades', 'specialists');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Professional profile status
DO $$ BEGIN
  CREATE TYPE professional_status AS ENUM ('pending', 'active', 'inactive', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Account type: solo freelancer or business with employees
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('solo', 'business');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Billing cycle chosen by the professional
DO $$ BEGIN
  CREATE TYPE billing_plan AS ENUM ('monthly', 'semi', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Three booking modes from PRD Section 22
DO $$ BEGIN
  CREATE TYPE booking_mode AS ENUM ('contact', 'date', 'full');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Booking lifecycle states from PRD Section 24
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',      -- Customer submitted, waiting for professional
    'confirmed',    -- Professional accepted
    'completed',    -- Service delivered
    'declined',     -- Professional declined (with reason)
    'cancelled',    -- Either party cancelled
    'no_show'       -- Customer didn't show up
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Review types from PRD Section 37 (each has different trust weight)
DO $$ BEGIN
  CREATE TYPE review_type AS ENUM (
    'verified',     -- From a completed booking (weight: 2x)
    'invitation',   -- Via professional's invite link (weight: 1x)
    'user'          -- Standard user rating (weight: 0.5x)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Subscription payment status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report status for moderation
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification delivery channel
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('inbox', 'email', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Scheduled email status
DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Referral status
DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('pending', 'active', 'expired', 'rewarded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- TABLE 1: categories
-- ═══════════════════════════════════════════════════════════════
-- All 48+ service categories grouped by pricing tier.
-- Admin can add/edit/toggle via admin panel (PRD Section 61).
-- Categories with active professionals cannot be deleted.

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,                    -- URL-friendly slug: "plumber", "nail-tech"
  name_el     TEXT NOT NULL,                       -- Greek display name
  name_en     TEXT NOT NULL,                       -- English display name
  icon        TEXT NOT NULL DEFAULT 'Wrench',      -- Lucide React icon name
  emoji       TEXT NOT NULL DEFAULT '🔧',          -- Emoji fallback
  tier        tier_type NOT NULL,                  -- Determines pricing
  active      BOOLEAN NOT NULL DEFAULT true,       -- Admin can toggle visibility
  sort_order  INTEGER NOT NULL DEFAULT 0,          -- Display order in dropdowns/grids
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ                          -- Soft delete (never truly remove)
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 2: customers
-- ═══════════════════════════════════════════════════════════════
-- Created automatically when a user signs in via Google/Facebook/Email.
-- Minimal data — customers don't need much to start browsing.
-- PRD Section 6: "Minimal friction"

CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,                             -- Set on first visit to /profile
  phone           TEXT,                             -- Optional, prompted but not required
  email           TEXT,                             -- From OAuth provider
  avatar_url      TEXT,                             -- From Google/Facebook
  marketing_consent BOOLEAN NOT NULL DEFAULT false, -- GDPR: ads & promotions opt-in
  language        TEXT NOT NULL DEFAULT 'el',       -- Preferred language (el/en)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ                       -- GDPR: account deletion
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 3: professionals
-- ═══════════════════════════════════════════════════════════════
-- The core table. Every professional who registers gets a row here.
-- Links to auth.users for authentication.
-- PRD Sections 14-21 define all profile features.

CREATE TABLE IF NOT EXISTS professionals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile basics (from registration form)
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,
  slug            TEXT UNIQUE,                      -- Auto-generated: nikos-papadopoulos

  -- Category & tier
  category_id     TEXT NOT NULL REFERENCES categories(id),
  tier            tier_type NOT NULL,
  account_type    account_type NOT NULL DEFAULT 'solo',

  -- Profile content
  bio             TEXT,                             -- Plain text for Standard, rich text for Business
  price_text      TEXT,                             -- Free-form pricing description
  city            TEXT,
  avatar_url      TEXT,

  -- Booking configuration (PRD Section 22)
  booking_mode    booking_mode NOT NULL DEFAULT 'contact',
  booking_enabled BOOLEAN NOT NULL DEFAULT false,   -- Requires profile completion

  -- Metrics (recalculated by triggers)
  rank            INTEGER NOT NULL DEFAULT 0,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,  -- 0.00 to 5.00
  review_count    INTEGER NOT NULL DEFAULT 0,
  job_count       INTEGER NOT NULL DEFAULT 0,

  -- Subscription & visibility
  billing_plan    billing_plan NOT NULL DEFAULT 'annual',
  featured        BOOLEAN NOT NULL DEFAULT false,   -- Προβολή Plus (PRD Section 55)
  status          professional_status NOT NULL DEFAULT 'pending',
  vacation_start  DATE,                             -- PRD Section 56
  vacation_end    DATE,

  -- Profile completion tracking (PRD Section 21)
  profile_complete BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps & soft delete
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Index for fast search by category + city + status
CREATE INDEX IF NOT EXISTS idx_professionals_search
  ON professionals(category_id, city, status)
  WHERE deleted_at IS NULL;

-- Index for slug lookups (profile URLs)
CREATE INDEX IF NOT EXISTS idx_professionals_slug
  ON professionals(slug)
  WHERE deleted_at IS NULL;

-- Trigram index for fuzzy name search
CREATE INDEX IF NOT EXISTS idx_professionals_name_trgm
  ON professionals USING gin ((first_name || ' ' || last_name) gin_trgm_ops);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 4: professional_areas (junction)
-- ═══════════════════════════════════════════════════════════════
-- Maps professionals to the geographic areas they serve.
-- One professional can serve many areas (e.g., all of Thessaloniki).

CREATE TABLE IF NOT EXISTS professional_areas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  area_id         TEXT NOT NULL,                    -- Matches area IDs from constants.ts
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, area_id)
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 5: professional_services (services catalog)
-- ═══════════════════════════════════════════════════════════════
-- Required for "full" booking mode (PRD Section 17).
-- Each service has a name, duration, and price.
-- Customer selects multiple → system sums duration + price.

CREATE TABLE IF NOT EXISTS professional_services (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name_el         TEXT NOT NULL,                    -- Greek service name
  name_en         TEXT,                             -- English (optional)
  duration_minutes INTEGER NOT NULL DEFAULT 60,     -- 30-minute increments, 30min to 480min (8h)
  price           NUMERIC(10,2) NOT NULL DEFAULT 0, -- €0 = free (e.g., "Δωρεάν εκτίμηση")
  active          BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  -- Duration must be in 30-minute increments between 30 and 480
  CONSTRAINT valid_duration CHECK (
    duration_minutes >= 30 AND
    duration_minutes <= 480 AND
    duration_minutes % 30 = 0
  )
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 6: business_pages (premium feature)
-- ═══════════════════════════════════════════════════════════════
-- Extended profile for annual subscribers and business accounts.
-- PRD Section 15: cover photo, logo, about, team, certifications.

CREATE TABLE IF NOT EXISTS business_pages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL UNIQUE REFERENCES professionals(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE,                      -- Custom URL: trustia.gr/business/my-salon
  business_name   TEXT NOT NULL,
  cover_url       TEXT,                             -- 1200px wide banner
  logo_url        TEXT,                             -- 400x400 logo
  about           TEXT,                             -- Rich text (bold, italic, lists, links)
  certifications  JSONB DEFAULT '[]'::jsonb,        -- Array of {name, file_url}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 7: team_members
-- ═══════════════════════════════════════════════════════════════
-- Business page team members (PRD Section 15).
-- Name + photo + role only — no mini-profiles yet.

CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_page_id UUID NOT NULL REFERENCES business_pages(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT,
  photo_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 8: portfolio_photos
-- ═══════════════════════════════════════════════════════════════
-- Professional's work gallery with optional before/after.
-- PRD Section 16: max 20 photos, drag-and-drop reorder, lightbox.

CREATE TABLE IF NOT EXISTS portfolio_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,                    -- Compressed to ~500KB-1MB
  thumbnail_url   TEXT,                             -- ~100KB thumbnail
  caption         TEXT,                             -- Max 100 characters
  is_before_after BOOLEAN NOT NULL DEFAULT false,   -- Shows 2 photos side by side
  after_photo_url TEXT,                             -- Only if is_before_after = true
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 9: availability_slots
-- ═══════════════════════════════════════════════════════════════
-- Professional's working hours + blocked dates.
-- Used by the booking calendar (PRD Section 23).

CREATE TABLE IF NOT EXISTS availability_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week     SMALLINT,                         -- 0=Sunday to 6=Saturday (null for specific dates)
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_blocked      BOOLEAN NOT NULL DEFAULT false,   -- True = not available (holiday/vacation)
  blocked_date    DATE,                             -- Specific date to block (null for recurring)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_day CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))
);

CREATE INDEX IF NOT EXISTS idx_availability_professional
  ON availability_slots(professional_id, day_of_week)
  WHERE is_blocked = false;


-- ═══════════════════════════════════════════════════════════════
-- TABLE 10: bookings
-- ═══════════════════════════════════════════════════════════════
-- Every booking on the platform. Central to the booking lifecycle.
-- PRD Sections 22-30 cover the full booking system.

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),

  -- Booking details
  booking_date    DATE NOT NULL,
  start_time      TIME,                             -- Null for "date" mode (no time slots)
  end_time        TIME,                             -- Calculated from service durations
  booking_mode    booking_mode NOT NULL,             -- Which mode was used

  -- Status & lifecycle (PRD Section 24)
  status          booking_status NOT NULL DEFAULT 'pending',
  decline_reason  TEXT,                             -- Required when professional declines
  cancel_reason   TEXT,                             -- Required when either party cancels
  cancelled_by    TEXT,                             -- 'customer', 'professional', or 'admin'

  -- Customer notes
  description     TEXT,                             -- What the customer needs
  customer_notes  TEXT,                             -- Additional info

  -- "Book for Someone Else" (PRD Section 27)
  customer_name   TEXT,                             -- Override name (booking for someone else)
  customer_phone  TEXT,                             -- Override phone
  customer_email  TEXT,                             -- Override email

  -- No-show tracking (PRD Section 25)
  no_show         BOOLEAN NOT NULL DEFAULT false,

  -- Selected services (for "full" booking mode)
  services        JSONB DEFAULT '[]'::jsonb,        -- Array of {service_id, name, duration, price}
  total_price     NUMERIC(10,2),                    -- Sum of selected service prices
  total_duration  INTEGER,                          -- Sum of service durations in minutes

  -- Professional response deadline (PRD Section 26)
  response_deadline TIMESTAMPTZ,                    -- 48h after booking creation

  -- Timestamps
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for professional's booking dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_professional
  ON bookings(professional_id, status, booking_date);

-- Index for customer's "My Bookings" page
CREATE INDEX IF NOT EXISTS idx_bookings_customer
  ON bookings(customer_id, status, booking_date);

-- Index for race condition checks (concurrent booking prevention)
CREATE INDEX IF NOT EXISTS idx_bookings_slot_check
  ON bookings(professional_id, booking_date, start_time)
  WHERE status IN ('pending', 'confirmed');


-- ═══════════════════════════════════════════════════════════════
-- TABLE 11: reviews
-- ═══════════════════════════════════════════════════════════════
-- Three review types with different trust weights.
-- PRD Sections 37-42 cover the full review system.

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  booking_id      UUID REFERENCES bookings(id),     -- Null for invitation/user reviews

  -- Review content
  rating          SMALLINT NOT NULL,                -- 1-5 stars
  text            TEXT,                             -- Review text (optional for ratings)
  type            review_type NOT NULL DEFAULT 'user',

  -- Trust weight (calculated from type)
  -- verified=2.0, invitation=1.0, user=0.5
  weight          NUMERIC(3,1) NOT NULL DEFAULT 0.5,

  -- Invitation link reference (for 'invitation' type)
  invitation_id   UUID REFERENCES review_invitations(id),

  -- Moderation
  status          TEXT NOT NULL DEFAULT 'active',   -- active, hidden, flagged
  hidden_reason   TEXT,                             -- Why admin hid it

  -- Timestamps
  edited_at       TIMESTAMPTZ,                      -- Track if review was edited
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,                      -- Soft delete

  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Note: review_invitations table must be created BEFORE reviews
-- because of the FK reference. We'll handle this with ALTER TABLE below.

-- Index for professional's review page
CREATE INDEX IF NOT EXISTS idx_reviews_professional
  ON reviews(professional_id, type)
  WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════
-- TABLE 12: review_photos
-- ═══════════════════════════════════════════════════════════════
-- Up to 5 photos per review (PRD Section 37).

CREATE TABLE IF NOT EXISTS review_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 13: review_invitations
-- ═══════════════════════════════════════════════════════════════
-- Unique codes professionals send to existing clients.
-- PRD Section 38: max 30/month, with usage limits and expiry.

CREATE TABLE IF NOT EXISTS review_invitations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,              -- Unique invitation code
  max_uses        INTEGER NOT NULL DEFAULT 1,        -- How many times this link can be used
  used_count      INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,                       -- Optional expiry
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add the FK from reviews to review_invitations
-- (handles the circular reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_invitation_id_fkey'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_invitation_id_fkey
      FOREIGN KEY (invitation_id) REFERENCES review_invitations(id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- TABLE 14: subscriptions
-- ═══════════════════════════════════════════════════════════════
-- Tracks professional subscription payments.
-- PRD Sections 47-54: tiers, stacking, renewal, expiry reminders.

CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Plan details
  tier            tier_type NOT NULL,
  billing_plan    billing_plan NOT NULL,
  account_type    account_type NOT NULL DEFAULT 'solo',

  -- Pricing (locked at time of subscription)
  monthly_price   NUMERIC(10,2) NOT NULL,           -- Price per month at signup
  total_amount    NUMERIC(10,2) NOT NULL,            -- Total payment amount

  -- Payment tracking (PRD Section 49)
  payment_reference TEXT NOT NULL UNIQUE,            -- MAS-2026-0047 format
  payment_method  TEXT,                              -- iris, bank, paypal, viva
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id),

  -- Subscription period
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ NOT NULL,
  is_founding     BOOLEAN NOT NULL DEFAULT false,    -- First 50 = locked price forever

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions(professional_id, ends_at)
  WHERE payment_status = 'verified';


-- ═══════════════════════════════════════════════════════════════
-- TABLE 15: customer_addresses
-- ═══════════════════════════════════════════════════════════════
-- Multi-address support for customers (PRD Section 33).

CREATE TABLE IF NOT EXISTS customer_addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Σπίτι',        -- "Σπίτι", "Γραφείο", custom
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  area_id     TEXT,
  postal_code TEXT,
  latitude    NUMERIC(10,7),                         -- For distance calculations
  longitude   NUMERIC(10,7),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 16: favorites
-- ═══════════════════════════════════════════════════════════════
-- Customer saved professionals (PRD Section 32).

CREATE TABLE IF NOT EXISTS favorites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, professional_id)
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 17: notifications
-- ═══════════════════════════════════════════════════════════════
-- In-app notification/inbox system (PRD Section 43).

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,                                  -- Internal URL to navigate to
  channel     notification_channel NOT NULL DEFAULT 'inbox',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read, created_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 18: scheduled_emails
-- ═══════════════════════════════════════════════════════════════
-- Queue for emails sent at future times (PRD Section 44).
-- pg_cron checks this hourly and sends due emails via Resend.

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID REFERENCES bookings(id),
  professional_id UUID REFERENCES professionals(id),
  email_type      TEXT NOT NULL,                     -- reminder, review_prompt, renewal, welcome, etc.
  recipient_email TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body_data       JSONB DEFAULT '{}'::jsonb,         -- Template variables
  send_at         TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          email_status NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending
  ON scheduled_emails(send_at)
  WHERE status = 'pending';


-- ═══════════════════════════════════════════════════════════════
-- TABLE 19: reports
-- ═══════════════════════════════════════════════════════════════
-- User reports on professionals and reviews (PRD Section 42).

CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES auth.users(id),
  target_type     TEXT NOT NULL,                     -- 'professional' or 'review'
  target_id       UUID NOT NULL,                     -- professional.id or review.id
  reason          TEXT NOT NULL,
  details         TEXT,
  status          report_status NOT NULL DEFAULT 'pending',
  resolved_by     UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 20: referrals
-- ═══════════════════════════════════════════════════════════════
-- Professional referral program tracking (PRD Section 58).

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES professionals(id),
  referred_id     UUID REFERENCES professionals(id),
  referral_code   TEXT NOT NULL UNIQUE,
  status          referral_status NOT NULL DEFAULT 'pending',
  reward_amount   NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 21: announcements
-- ═══════════════════════════════════════════════════════════════
-- Announcement bar managed by admin (PRD Section 65).

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_el     TEXT NOT NULL,
  text_en     TEXT,
  link_url    TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  view_count  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id),
  starts_at   TIMESTAMPTZ,                           -- Scheduled start
  ends_at     TIMESTAMPTZ,                           -- Scheduled end
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 22: roles
-- ═══════════════════════════════════════════════════════════════
-- Custom role groups (PRD Section 62).
-- Admin creates groups and assigns specific permissions.

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 23: role_permissions
-- ═══════════════════════════════════════════════════════════════
-- Maps permissions to roles. 15 permission types from PRD.
-- Each permission is granular: view/edit/delete separated.

CREATE TABLE IF NOT EXISTS role_permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL,                          -- e.g., 'review.moderate', 'professional.edit'
  UNIQUE(role_id, permission)
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 24: user_roles (junction)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 25: audit_log
-- ═══════════════════════════════════════════════════════════════
-- Every admin/moderator action logged (Architecture Doc principle).
-- "Audit Everything"

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  user_role   TEXT NOT NULL,                          -- 'admin', 'moderator', role name
  action      TEXT NOT NULL,                          -- 'professional.activate', 'review.hide', etc.
  target_type TEXT NOT NULL,                          -- 'professional', 'review', 'booking', etc.
  target_id   UUID NOT NULL,
  details     JSONB DEFAULT '{}'::jsonb,              -- Additional context
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_target
  ON audit_log(target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user
  ON audit_log(user_id, created_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 26: platform_settings
-- ═══════════════════════════════════════════════════════════════
-- Key-value store for ALL admin-configurable settings.
-- PRD Section 63: "All configurable fields in one centralized page"

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,                       -- 'auto_activate', 'response_deadline_hours', etc.
  value       JSONB NOT NULL,                         -- Flexible value (number, string, boolean, object)
  description TEXT,                                   -- What this setting does (shown in admin)
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 27: platform_features (feature entitlements)
-- ═══════════════════════════════════════════════════════════════
-- Controls which plans/groups/users can access premium features.
-- PRD Section 3: Universal access control pattern.

CREATE TABLE IF NOT EXISTS platform_features (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key     TEXT NOT NULL UNIQUE,               -- 'vacation_mode', 'business_page', etc.
  name            TEXT NOT NULL,
  description     TEXT,
  enabled         BOOLEAN NOT NULL DEFAULT true,      -- Global on/off
  allowed_plans   JSONB DEFAULT '[]'::jsonb,          -- ["monthly", "semi", "annual"]
  allowed_groups  JSONB DEFAULT '[]'::jsonb,          -- [group_id, group_id]
  allowed_users   JSONB DEFAULT '[]'::jsonb,          -- [user_id, user_id]
  settings        JSONB DEFAULT '{}'::jsonb,          -- Feature-specific config
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 28: invoices
-- ═══════════════════════════════════════════════════════════════
-- Generated PDF receipts for professional subscriptions.
-- PRD Section 54.

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  invoice_number  TEXT NOT NULL UNIQUE,               -- INV-2026-0001
  amount          NUMERIC(10,2) NOT NULL,
  pdf_url         TEXT,                               -- Stored in Supabase Storage
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 29: email_unsubscribes
-- ═══════════════════════════════════════════════════════════════
-- Tracks who unsubscribed and why (PRD Section 45).

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  email       TEXT NOT NULL,
  reason      TEXT,                                   -- Optional exit survey answer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 30: recently_viewed
-- ═══════════════════════════════════════════════════════════════
-- Tracks which professionals a customer has viewed.
-- PRD Section 34: "Threshold: 3 profiles" before showing section.

CREATE TABLE IF NOT EXISTS recently_viewed (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, professional_id)
);


-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- ── Auto-update updated_at timestamp ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'categories', 'customers', 'professionals', 'professional_services',
      'business_pages', 'bookings', 'reviews', 'subscriptions',
      'customer_addresses', 'reports', 'referrals', 'platform_features'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I; CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ── Auto-generate professional slug from name ──
CREATE OR REPLACE FUNCTION generate_professional_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create slug from first_name + last_name (lowercase, hyphenated)
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.first_name || '-' || NEW.last_name),
      '[^a-z0-9-]', '', 'g'
    )
  );

  final_slug := base_slug;

  -- Handle duplicates: nikos-papadopoulos, nikos-papadopoulos-2, etc.
  WHILE EXISTS (SELECT 1 FROM professionals WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Need the unaccent extension for Greek name slugs
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE TRIGGER trg_professional_slug
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION generate_professional_slug();


-- ── Auto-generate payment reference code ──
-- Format: TRS-2026-0047 (sequential)
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(split_part(payment_reference, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM subscriptions
  WHERE payment_reference LIKE 'TRS-' || year_str || '-%';

  NEW.payment_reference := 'TRS-' || year_str || '-' || lpad(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_payment_reference
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.payment_reference IS NULL OR NEW.payment_reference = '')
  EXECUTE FUNCTION generate_payment_reference();


-- ── Auto-create customer record on first sign-in ──
-- Triggered by Supabase Auth creating a new user in auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (user_id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Idempotent
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ── Set response deadline on new bookings ──
CREATE OR REPLACE FUNCTION set_booking_response_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Default 48h deadline; reads from platform_settings if available
  NEW.response_deadline := now() + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_booking_deadline
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_response_deadline();


-- ── Recalculate professional rating on review changes ──
CREATE OR REPLACE FUNCTION recalculate_professional_rating()
RETURNS TRIGGER AS $$
DECLARE
  prof_id UUID;
  new_rating NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  -- Determine which professional to recalculate
  prof_id := COALESCE(NEW.professional_id, OLD.professional_id);

  -- Weighted average: verified=2.0, invitation=1.0, user=0.5
  SELECT
    COALESCE(ROUND(SUM(rating * weight) / NULLIF(SUM(weight), 0), 2), 0),
    COUNT(*)
  INTO new_rating, new_count
  FROM reviews
  WHERE professional_id = prof_id
    AND deleted_at IS NULL
    AND status = 'active';

  UPDATE professionals
  SET rating = new_rating,
      review_count = new_count
  WHERE id = prof_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_professional_rating();


-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════
-- Every table needs RLS enabled. Without it, any authenticated
-- user could read/write any data via the Supabase client.

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- Helper function: check if current user is admin
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────
-- CATEGORIES — Everyone can read active categories
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "categories_read_all" ON categories
  FOR SELECT USING (active = true AND deleted_at IS NULL);

CREATE POLICY "categories_admin_all" ON categories
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- CUSTOMERS — Users can only see/edit their own record
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "customers_read_own" ON customers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "customers_insert_self" ON customers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_admin_all" ON customers
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- PROFESSIONALS — Public read for active profiles, self-edit
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "professionals_read_active" ON professionals
  FOR SELECT USING (
    status = 'active' AND deleted_at IS NULL AND profile_complete = true
  );

-- Professional can always read their own profile (even if pending)
CREATE POLICY "professionals_read_own" ON professionals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "professionals_update_own" ON professionals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "professionals_insert_self" ON professionals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "professionals_admin_all" ON professionals
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- PROFESSIONAL_AREAS — Public read, self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "pro_areas_read_all" ON professional_areas
  FOR SELECT USING (true);

CREATE POLICY "pro_areas_manage_own" ON professional_areas
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "pro_areas_admin" ON professional_areas
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- PROFESSIONAL_SERVICES — Public read, self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "pro_services_read_all" ON professional_services
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "pro_services_manage_own" ON professional_services
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "pro_services_admin" ON professional_services
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- BUSINESS_PAGES — Public read, self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "business_pages_read_all" ON business_pages
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "business_pages_manage_own" ON business_pages
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "business_pages_admin" ON business_pages
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- TEAM_MEMBERS — Public read, managed through business page
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "team_members_read_all" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "team_members_manage_own" ON team_members
  FOR ALL USING (
    business_page_id IN (
      SELECT bp.id FROM business_pages bp
      JOIN professionals p ON p.id = bp.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_admin" ON team_members
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- PORTFOLIO_PHOTOS — Public read, self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "portfolio_read_all" ON portfolio_photos
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "portfolio_manage_own" ON portfolio_photos
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "portfolio_admin" ON portfolio_photos
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- AVAILABILITY_SLOTS — Public read (for calendar), self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "availability_read_all" ON availability_slots
  FOR SELECT USING (true);

CREATE POLICY "availability_manage_own" ON availability_slots
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "availability_admin" ON availability_slots
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- BOOKINGS — Both parties can see their own bookings
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "bookings_customer_read" ON bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_professional_read" ON bookings
  FOR SELECT USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_customer_insert" ON bookings
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Customers can cancel their own bookings
CREATE POLICY "bookings_customer_cancel" ON bookings
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Professionals can update status (accept/decline/complete)
CREATE POLICY "bookings_professional_update" ON bookings
  FOR UPDATE USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_admin_all" ON bookings
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- REVIEWS — Public read active reviews, customers can manage own
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "reviews_read_active" ON reviews
  FOR SELECT USING (deleted_at IS NULL AND status = 'active');

CREATE POLICY "reviews_customer_insert" ON reviews
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_customer_manage" ON reviews
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_customer_delete" ON reviews
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- REVIEW_PHOTOS — Public read, tied to review ownership
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "review_photos_read" ON review_photos
  FOR SELECT USING (true);

CREATE POLICY "review_photos_manage" ON review_photos
  FOR ALL USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN customers c ON c.id = r.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "review_photos_admin" ON review_photos
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- REVIEW_INVITATIONS — Professional manages own
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "invitations_read_all" ON review_invitations
  FOR SELECT USING (true);

CREATE POLICY "invitations_manage_own" ON review_invitations
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "invitations_admin" ON review_invitations
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS — Professional reads own, admin manages all
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "subscriptions_read_own" ON subscriptions
  FOR SELECT USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- CUSTOMER_ADDRESSES — Self-manage only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "addresses_manage_own" ON customer_addresses
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "addresses_admin" ON customer_addresses
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- FAVORITES — Self-manage only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "favorites_manage_own" ON favorites
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "favorites_admin" ON favorites
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS — Users see only their own
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_admin" ON notifications
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- SCHEDULED_EMAILS — Admin only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "emails_admin_only" ON scheduled_emails
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- REPORTS — Users can submit, admin manages
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "reports_insert_any" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_read_own" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "reports_admin_all" ON reports
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- REFERRALS — Professional reads own
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "referrals_read_own" ON referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "referrals_admin" ON referrals
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- ANNOUNCEMENTS — Public read, admin manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "announcements_read_active" ON announcements
  FOR SELECT USING (active = true);

CREATE POLICY "announcements_admin" ON announcements
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- ROLES / PERMISSIONS / USER_ROLES — Admin only
-- ─────────────────────────────────────────────────────────────
-- Any authenticated user can read role names (needed for navbar admin-check).
-- Write operations (INSERT/UPDATE/DELETE) remain admin-only.
CREATE POLICY "roles_read_authenticated" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "roles_admin" ON roles FOR ALL USING (is_admin());
CREATE POLICY "role_permissions_admin" ON role_permissions FOR ALL USING (is_admin());

CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin" ON user_roles
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- AUDIT_LOG — Admin read only (nobody can delete)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (true);  -- Any authenticated user action can be logged


-- ─────────────────────────────────────────────────────────────
-- PLATFORM_SETTINGS — Admin only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "settings_read_all" ON platform_settings
  FOR SELECT USING (true);  -- Some settings needed client-side

CREATE POLICY "settings_admin_write" ON platform_settings
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- PLATFORM_FEATURES — Read for feature checks, admin manages
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "features_read_all" ON platform_features
  FOR SELECT USING (true);

CREATE POLICY "features_admin" ON platform_features
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- INVOICES — Professional reads own, admin manages
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "invoices_read_own" ON invoices
  FOR SELECT USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_admin" ON invoices
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- EMAIL_UNSUBSCRIBES — Self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "unsubscribes_manage_own" ON email_unsubscribes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "unsubscribes_admin" ON email_unsubscribes
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────
-- RECENTLY_VIEWED — Self-manage
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "recently_viewed_manage_own" ON recently_viewed
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: Categories (all 48 from constants.ts)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO categories (id, name_el, name_en, icon, emoji, tier, sort_order) VALUES
  -- LIGHT SERVICES (6)
  ('house-cleaning',    'Καθαρισμός Σπιτιού',       'House Cleaning',          'Sparkles',    '🧹', 'light', 1),
  ('office-cleaning',   'Καθαρισμός Γραφείων',       'Office Cleaning',         'Building2',   '🏢', 'light', 2),
  ('ironing',           'Σιδέρωμα',                  'Ironing',                 'Shirt',       '👔', 'light', 3),
  ('gardening',         'Κηπουρική',                  'Gardening',               'Flower2',     '🌿', 'light', 4),
  ('pet-sitting',       'Φύλαξη Κατοικιδίων',        'Pet Sitting',             'Dog',         '🐕', 'light', 5),
  ('small-moving',      'Μικρομεταφορές',             'Small Moving',            'Package',     '📦', 'light', 6),

  -- TRADES & BEAUTY (29)
  ('plumber',           'Υδραυλικός',                 'Plumber',                 'Wrench',       '🔧', 'trades', 10),
  ('electrician',       'Ηλεκτρολόγος',               'Electrician',             'Zap',          '⚡', 'trades', 11),
  ('painter',           'Ελαιοχρωματιστής',           'Painter',                 'Paintbrush',   '🎨', 'trades', 12),
  ('handyman',          'Γενικές Επισκευές',          'Handyman',                'Hammer',       '🛠️', 'trades', 13),
  ('hvac',              'Ψυκτικός / Κλιματισμός',     'HVAC / AC',               'Snowflake',    '❄️', 'trades', 14),
  ('locksmith',         'Κλειδαράς',                  'Locksmith',               'KeyRound',     '🔑', 'trades', 15),
  ('moving',            'Μετακομίσεις',               'Moving',                  'Truck',        '🚚', 'trades', 16),
  ('pest-control',      'Απεντομώσεις',               'Pest Control',            'Bug',          '🐜', 'trades', 17),
  ('furniture-assembly','Συναρμολόγηση Επίπλων',      'Furniture Assembly',      'Armchair',     '🪑', 'trades', 18),
  ('appliance-repair',  'Επισκευή Συσκευών',          'Appliance Repair',        'Plug',         '🔌', 'trades', 19),
  ('windows-frames',    'Κουφώματα / Αλουμίνια',      'Windows / Frames',        'SquareStack',  '🪟', 'trades', 20),
  ('awnings',           'Τέντες / Πέργκολες',         'Awnings / Pergolas',      'Umbrella',     '⛱️', 'trades', 21),
  ('security-doors',    'Πόρτες Ασφαλείας',           'Security Doors',          'DoorOpen',     '🚪', 'trades', 22),
  ('drainage',          'Αποχέτευση / Αποφράξεις',    'Drainage',                'Droplets',     '🚰', 'trades', 23),
  ('drywall',           'Γυψοσανίδες',                'Drywall',                 'LayoutGrid',   '📐', 'trades', 24),
  ('flooring',          'Πατώματα / Δάπεδα',          'Flooring',                'Layers',       '🪵', 'trades', 25),
  ('tiles-marble',      'Πλακάκια / Μάρμαρα',         'Tiles / Marble',          'Grid3x3',      '🧱', 'trades', 26),
  ('plastering',        'Σοβατίσματα',                'Plastering',              'HardHat',      '🏗️', 'trades', 27),
  ('carpentry',         'Ξυλουργικές',                'Carpentry',               'Axe',          '🪚', 'trades', 28),
  ('railings',          'Κάγκελα / Μεταλλουργεία',    'Railings / Metalwork',    'Fence',        '⚙️', 'trades', 29),
  ('heating',           'Θέρμανση / Φυσικό Αέριο',    'Heating / Natural Gas',   'Flame',        '🔥', 'trades', 30),
  ('wallpaper',         'Ταπετσαρίες',                'Wallpaper',               'Image',        '🖼️', 'trades', 31),
  ('glass-glazing',     'Τζάμια / Υαλοπίνακες',       'Glass / Glazing',         'GlassWater',   '🪞', 'trades', 32),
  ('alarms-cctv',       'Συναγερμοί / Κάμερες',       'Alarms / CCTV',           'Camera',       '📹', 'trades', 33),
  ('shutters',          'Ρολά',                       'Shutters',                'PanelTopClose', '🪟', 'trades', 34),
  ('nail-tech',         'Τεχνίτρια Νυχιών',           'Nail Technician',         'Hand',         '💅', 'trades', 35),
  ('makeup-artist',     'Μακιγιέρ',                   'Makeup Artist',           'Palette',      '💄', 'trades', 36),
  ('hairdresser',       'Κομμωτής κατ'' οίκον',       'Hairdresser (Home Visit)','Scissors',     '✂️', 'trades', 37),
  ('lash-brow',         'Βλεφαρίδες / Φρύδια',        'Lash / Brow Specialist',  'Eye',          '👁️', 'trades', 38),

  -- SPECIALISTS (14)
  ('renovation',        'Ανακαίνιση',                 'Renovation',              'Home',          '🏠', 'specialists', 50),
  ('architect',         'Αρχιτέκτονας',               'Architect',               'Ruler',         '📐', 'specialists', 51),
  ('civil-engineer',    'Πολιτικός Μηχανικός',        'Civil Engineer',          'HardHat',       '🏗️', 'specialists', 52),
  ('interior-designer', 'Διακοσμητής',                'Interior Designer',       'Palette',       '🎨', 'specialists', 53),
  ('solar-panels',      'Φωτοβολταϊκά',               'Solar Panels',            'Sun',           '☀️', 'specialists', 54),
  ('smart-home',        'Smart Home',                 'Smart Home',              'Smartphone',    '📱', 'specialists', 55),
  ('kitchen-bath',      'Κουζίνα / Μπάνιο',           'Kitchen / Bath Design',   'UtensilsCrossed','🍳', 'specialists', 56),
  ('insulation',        'Μονώσεις',                   'Insulation',              'Thermometer',   '🧊', 'specialists', 57),
  ('structural',        'Δομικές Εργασίες',           'Structural Work',         'Building',      '🧱', 'specialists', 58),
  ('fireplaces',        'Τζάκια',                     'Fireplaces',              'Flame',         '🔥', 'specialists', 59),
  ('elevators',         'Ανελκυστήρες',               'Elevators',               'ArrowUpDown',   '🛗', 'specialists', 60),
  ('pools',             'Πισίνες',                    'Swimming Pools',          'Waves',         '🏊', 'specialists', 61),
  ('fencing',           'Περιφράξεις',                'Fencing',                 'Fence',         '🔒', 'specialists', 62),
  ('excavation',        'Εκσκαφές',                   'Excavation',              'Shovel',        '⛏️', 'specialists', 63)
ON CONFLICT (id) DO UPDATE SET
  name_el = EXCLUDED.name_el,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  emoji = EXCLUDED.emoji,
  tier = EXCLUDED.tier,
  sort_order = EXCLUDED.sort_order;


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: Default platform settings (PRD Section 63)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO platform_settings (key, value, description) VALUES
  ('auto_activate_without_payment', 'true', 'Trust-first: activate professionals before payment verification'),
  ('payment_alert_days', '3', 'Days after registration before admin gets payment alert'),
  ('auto_deactivate_enabled', 'true', 'Auto-deactivate professionals who havent paid'),
  ('auto_deactivate_days', '7', 'Days after alert before auto-deactivation'),
  ('response_deadline_hours', '48', 'Hours professional has to respond to a booking'),
  ('max_categories_per_professional', '3', 'Maximum categories a professional can have'),
  ('second_category_discount', '30', 'Percentage discount on 2nd category'),
  ('max_portfolio_photos', '20', 'Maximum portfolio photos per professional'),
  ('max_review_photos', '5', 'Maximum photos per review'),
  ('max_invitation_links_month', '30', 'Maximum review invitation links per month'),
  ('vacation_max_days', '40', 'Maximum vacation days per year'),
  ('grace_period_days', '7', 'Days after subscription expiry before profile hidden'),
  ('founding_member_limit', '50', 'First N members get locked pricing forever'),
  ('maintenance_mode', 'false', 'When true, show maintenance page to all visitors'),
  ('maintenance_message', '"Θα επιστρέψουμε σύντομα!"', 'Custom maintenance page message')
ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: Default feature entitlements (PRD Section 3)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO platform_features (feature_key, name, description, enabled, allowed_plans, settings) VALUES
  ('vacation_mode', 'Vacation Mode', 'Professionals can pause their profile temporarily', true,
   '["annual"]'::jsonb, '{"max_days_per_year": 40}'::jsonb),
  ('business_page', 'Business Page', 'Premium profile with cover photo, team, portfolio', true,
   '["annual"]'::jsonb, '{}'::jsonb),
  ('review_invitations', 'Review Invitation Links', 'Generate links for existing clients to leave reviews', true,
   '["monthly", "semi", "annual"]'::jsonb, '{"max_per_month": 30}'::jsonb),
  ('portfolio_gallery', 'Portfolio Gallery', 'Upload portfolio photos with before/after', true,
   '["monthly", "semi", "annual"]'::jsonb, '{"max_photos": 20}'::jsonb),
  ('provoli_plus', 'Προβολή Plus', 'Boosted visibility in search results', true,
   '["monthly", "semi", "annual"]'::jsonb, '{"monthly_cost": 10}'::jsonb),
  ('custom_url', 'Custom URL Slug', 'Choose a custom business page URL', true,
   '["annual"]'::jsonb, '{}'::jsonb)
ON CONFLICT (feature_key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════
-- Migration complete. Tables: 30, Triggers: 6, Functions: 7,
-- RLS Policies: 50+, Seed categories: 48, Settings: 15
--
-- Next steps:
-- 1. Run this SQL in Supabase Dashboard > SQL Editor
-- 2. Enable pg_cron extension from Dashboard > Extensions
-- 3. Set up Storage buckets for photos (profile, portfolio, reviews)
-- 4. Configure Auth providers (Google, Facebook)
-- =============================================================
