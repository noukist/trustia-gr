-- =============================================================
-- TRUSTIA.GR — Storage Buckets Setup
-- =============================================================
-- Run this in Supabase SQL Editor AFTER the main migration.
-- Creates storage buckets for all image types (PRD Section 73).
-- =============================================================

-- ── Profile photos (professionals + customers) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,   -- Public: profile photos need to be visible to everyone
  5242880, -- 5MB max upload
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ── Portfolio photos (before/after, gallery) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ── Review photos ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reviews',
  'reviews',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ── Business page assets (logos, covers) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business',
  'business',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- ── Invoices (PDF receipts, private) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,  -- Private: only the professional and admin can access
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- STORAGE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- ── Avatars: anyone can view, users upload their own ──
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Portfolio: anyone can view, professional uploads own ──
CREATE POLICY "portfolio_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

CREATE POLICY "portfolio_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "portfolio_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "portfolio_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Reviews: anyone can view, customer uploads own ──
CREATE POLICY "reviews_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'reviews');

CREATE POLICY "reviews_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reviews'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Business: anyone can view, professional uploads own ──
CREATE POLICY "business_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'business');

CREATE POLICY "business_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "business_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Invoices: professional reads own, admin reads all ──
CREATE POLICY "invoices_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================
-- DONE! Storage buckets: 5 (avatars, portfolio, reviews, business, invoices)
--
-- File path convention: {bucket}/{user_id}/{filename}
-- Example: avatars/abc-123-def/profile.jpg
-- This ensures RLS policies work correctly.
-- =============================================================
