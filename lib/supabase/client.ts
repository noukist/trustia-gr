/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase client — use this in "use client" components.
 *
 * Creates a singleton client via createBrowserClient from @supabase/ssr so
 * that the same instance is reused across re-renders, keeping the auth state
 * consistent on the client.
 *
 * Usage:
 *   "use client"
 *   import { createClient } from "@/lib/supabase/client"
 *   const supabase = createClient()
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
