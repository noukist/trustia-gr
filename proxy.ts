/**
 * proxy.ts  (Next.js 16 — replaces middleware.ts)
 *
 * Runs on every incoming request at the Edge before the page renders.
 * Two things happen here in sequence:
 *
 *   1. Supabase session refresh (updateSession)
 *      Reads auth cookies, silently refreshes the access token if expired,
 *      and writes updated tokens back onto both request and response.
 *      This never redirects — it only refreshes cookies.
 *
 *   2. next-intl locale routing (createMiddleware)
 *      Detects the locale from the URL path and sets the
 *      x-next-intl-locale header used by Server Components.
 *      With localePrefix "as-needed", Greek (default) stays at /services
 *      and English is served at /en/services — no redirect for Greek.
 *
 * After both run, we merge the Supabase auth cookies onto the intl
 * response so the browser always receives fresh tokens regardless of
 * whether next-intl needed to redirect or not.
 */

import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

import { routing }       from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// Build the next-intl middleware once (singleton — not recreated per request)
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // ── 1. Supabase auth token refresh ─────────────────────────
  // Always run first. updateSession() never redirects; it only
  // reads + writes auth cookies so the current render has a fresh session.
  const supabaseResponse = await updateSession(request);

  // ── 2. next-intl locale routing ─────────────────────────────
  // Handles locale detection from the URL and sets the
  // x-next-intl-locale request header consumed by getTranslations().
  const intlResponse = intlMiddleware(request);

  // ── 3. Merge Supabase cookies onto the intl response ────────
  // intlResponse is what we ultimately return. Copy any updated
  // Supabase auth cookies (refreshed tokens) onto it so they reach
  // the browser.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

// Run on every route except static assets, API routes, and auth callbacks.
// API and auth routes are excluded because they don't need locale routing.
export const config = {
  matcher: [
    "/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
