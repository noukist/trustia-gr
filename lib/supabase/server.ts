/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client — use this in:
 *   - Server Components (app/...page.tsx, app/...layout.tsx)
 *   - Route Handlers (app/api/.../route.ts)
 *   - Server Actions
 *
 * A fresh client is created on every call so that each server render gets an
 * isolated instance tied to the current request's cookies. Never share a
 * single server client across requests.
 *
 * The getAll / setAll cookie interface is required by @supabase/ssr v0.6+.
 * setAll is a no-op in Server Components (cookies cannot be mutated during
 * rendering) — the proxy.ts middleware handles token refreshes.
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/server"
 *   const supabase = await createClient()
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component — the cookie store is
            // read-only in that context. This is safe: token refreshes are
            // handled by the proxy middleware instead.
          }
        },
      },
    }
  );
}
