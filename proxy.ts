/**
 * proxy.ts  (Next.js 16 — replaces the deprecated middleware.ts)
 *
 * Runs on the server before every matched request. Its sole job here is to
 * keep the Supabase auth session alive: it silently refreshes the access token
 * when it expires and writes the updated cookies onto both the request and the
 * response so that every server component and the browser always see a valid
 * session.
 *
 * Do NOT perform database queries or heavy logic here — the proxy executes on
 * every route and adding latency degrades the entire app.
 *
 * In Next.js 16 the file is named proxy.ts and the exported function is named
 * `proxy`. The old middleware.ts / middleware() convention is deprecated.
 * Migration guide: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run the proxy on every path EXCEPT:
     *   - _next/static   static assets (JS, CSS, fonts)
     *   - _next/image    image optimisation responses
     *   - favicon.ico    browser favicon
     *   - sitemap.xml    SEO sitemap
     *   - robots.txt     SEO robots
     *
     * The negative lookahead keeps API routes and all app pages included so
     * that auth sessions are refreshed on every meaningful request.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
