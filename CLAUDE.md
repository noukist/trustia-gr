@AGENTS.md

# TRUSTIA.GR — Project Context for AI Agents

## What This Is
Trustia.gr is a subscription-based home services & beauty marketplace for Greece.
Professionals pay a flat monthly subscription (zero commission) and keep 100% of earnings.
Customers use the platform for free.

## Architecture
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + CSS custom properties in globals.css
- **Database**: Supabase PostgreSQL (project ID: myiiwppwmrlfqsjwzrxj)
- **Auth**: Supabase Auth (Google OAuth, Facebook, Email/Password)
- **Storage**: Supabase Storage (avatars, portfolio, reviews, business, invoices buckets)
- **Hosting**: Vercel (auto-deploy from main branch)
- **Icons**: Lucide React (mapping in lib/categoryIcons.tsx)

## Key Files
- `lib/constants.ts` — All 48 categories, tiers, pricing, regions, areas
- `lib/supabase.ts` — Supabase client (needs server-side client too)
- `app/globals.css` — Brand colors as CSS variables (--color-primary: #2A8F8F, --color-accent: #D4A039)
- `supabase/migrations/001_complete_schema.sql` — Full database schema (30 tables, 50+ RLS policies)
- `supabase/migrations/002_storage_buckets.sql` — Storage buckets setup
- `components/layout/` — Navbar, Footer, AnnouncementBar (shared across all pages)
- `components/home/` — Homepage section components

## Brand
- **Name**: TRUSTIA.GR
- **Font**: DM Sans (loaded from Google Fonts, supports Greek)
- **Primary color**: #2A8F8F (teal)
- **Accent color**: #D4A039 (gold)
- **Language**: Greek primary (el), English secondary (en)
- **Tagline EL**: "Βρες τον ειδικό για κάθε ανάγκη"

## Database Schema (30 tables)
Core: categories, customers, professionals, professional_areas, professional_services
Booking: bookings, availability_slots
Reviews: reviews, review_photos, review_invitations
Business: business_pages, team_members, portfolio_photos
Payments: subscriptions, invoices
Customer: customer_addresses, favorites, recently_viewed
Platform: notifications, scheduled_emails, reports, referrals, announcements
Admin: roles, role_permissions, user_roles, audit_log, platform_settings, platform_features
Email: email_unsubscribes

## Three Booking Modes (PRD Section 22)
1. **Contact Only**: Customer sees phone + email, calls directly
2. **Date Booking**: Customer picks a date, adds description
3. **Full Calendar**: Service catalog → date → time slot → price calculated

## Three Review Types (PRD Section 37)
1. **Verified** (weight 2.0): From completed booking, green badge
2. **Invitation** (weight 1.0): Via professional's invite link, amber badge
3. **User** (weight 0.5): Standard rating

## Coding Rules (ALWAYS follow these)
- Always specify exact file paths for every change
- Include thorough comments in all code
- Make targeted find-and-replace edits — NEVER rewrite entire files
- Give changes one step at a time
- Use CSS variables from globals.css, not hardcoded colors
- Greek text first (el), English fallback (en)
- Every component must work on mobile (responsive-first)
- Supabase RLS is enabled on ALL tables — respect the policies
