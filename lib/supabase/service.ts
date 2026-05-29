// =============================================================
// lib/supabase/service.ts
// =============================================================
// Service-role Supabase client — bypasses ALL RLS policies.
//
// USE ONLY IN:
//   • Stripe webhook handler (no auth session available)
//   • Internal cron jobs / server-only background tasks
//
// NEVER import this in client components, Server Components
// that render user data, or Server Actions triggered by users.
// The service role key must NEVER be exposed to the browser.
//
// REQUIRED ENV VAR (server-only, never prefixed with NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY  — from Supabase Dashboard → Settings → API
// =============================================================

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url)    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!svcKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server-only).");

  return createClient(url, svcKey, {
    auth: {
      // Service clients never use sessions or cookies
      persistSession:  false,
      autoRefreshToken: false,
    },
  });
}
