/**
 * lib/supabase/middleware.ts
 *
 * Supabase auth session refresh helper for the Next.js proxy (middleware).
 *
 * Call updateSession() inside proxy.ts on every request. It:
 *   1. Reads the existing Supabase auth cookies from the incoming request.
 *   2. Calls supabase.auth.getUser() which silently refreshes the access
 *      token if it has expired (using the refresh token in the cookie).
 *   3. Writes any updated cookies (new access/refresh tokens) onto both the
 *      request (so server components on this render see the fresh session)
 *      and the response (so the browser stores the new tokens).
 *
 * IMPORTANT: This must use getAll + setAll — the deprecated get/set/remove
 * API misses edge cases and is unsupported in @supabase/ssr v0.6+.
 *
 * Usage (from proxy.ts):
 *   import { updateSession } from "@/lib/supabase/middleware"
 *   export async function proxy(request: NextRequest) {
 *     return await updateSession(request)
 *   }
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a response that continues the request unchanged.
  // We clone the request headers so we can mutate them without side effects.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write the updated tokens onto the request so that the current
          // server render sees the refreshed session immediately.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Rebuild the response each time setAll is called so that the
          // Set-Cookie headers accumulate correctly.
          supabaseResponse = NextResponse.next({
            request,
          });

          // Write the updated tokens onto the response so the browser stores
          // the refreshed tokens in its cookie jar.
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Calling getUser() triggers a silent token refresh if the access token has
  // expired. The result is not used here — we only care about the side effect
  // of refreshed cookies being written back via setAll above.
  //
  // Do NOT add logic that depends on the user object between createServerClient
  // and getUser(). Doing so can cause intermittent auth bugs.
  await supabase.auth.getUser();

  return supabaseResponse;
}
