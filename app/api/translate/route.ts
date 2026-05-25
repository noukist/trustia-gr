/**
 * app/api/translate/route.ts
 *
 * Server-side proxy for Google Cloud Translation API.
 *
 * PURPOSE
 * -------
 * Professional bios, service descriptions, and other dynamic content
 * are stored in Greek in the database. When a user visits in English,
 * we translate on-the-fly using the Google Cloud Translation API.
 *
 * CACHING STRATEGY
 * ----------------
 * 1. Check the `bio_en` column in the `professionals` table.
 *    If it's already populated, return it instantly (zero API cost).
 *
 * 2. If not cached, call Google Translate API.
 *
 * 3. Save the result back to `professionals.bio_en` so future
 *    requests for the same professional skip the API entirely.
 *
 * This means each professional's bio is translated at most ONCE,
 * keeping costs near zero even with many visitors.
 *
 * RATE LIMITING
 * -------------
 * We translate one text per request, max 5000 characters.
 * With caching, API calls drop to near-zero after initial warmup.
 *
 * REQUEST FORMAT
 * --------------
 * POST /api/translate
 * {
 *   "text":          string,   // Greek text to translate (max 5000 chars)
 *   "target":        string,   // ISO language code: "en"
 *   "professionalId"?: string, // If provided, caches result to bio_en
 * }
 *
 * RESPONSE FORMAT
 * ---------------
 * 200: { "translatedText": string }
 * 400: { "error": string }
 * 500: { "error": string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@/lib/supabase/server";

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/** Max characters accepted per request to bound cost per call */
const MAX_CHARS = 5000;

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────
  let body: { text?: unknown; target?: unknown; professionalId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text           = typeof body.text           === "string" ? body.text.trim()           : "";
  const target         = typeof body.target         === "string" ? body.target.trim()         : "";
  const professionalId = typeof body.professionalId === "string" ? body.professionalId.trim() : null;

  if (!text)   return NextResponse.json({ error: "text is required." },   { status: 400 });
  if (!target) return NextResponse.json({ error: "target is required." }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `text must be ≤${MAX_CHARS} characters.` }, { status: 400 });
  }

  // ── 1. Check cache (bio_en column) ────────────────────────────
  if (professionalId && target === "en") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("professionals")
      .select("bio_en")
      .eq("id", professionalId)
      .maybeSingle();

    if (data?.bio_en) {
      return NextResponse.json({ translatedText: data.bio_en, cached: true });
    }
  }

  // ── 2. API key guard ──────────────────────────────────────────
  if (!GOOGLE_TRANSLATE_API_KEY) {
    // In dev without an API key, return a placeholder so the UI still works
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        translatedText: `[Translation unavailable — add GOOGLE_TRANSLATE_API_KEY to .env.local]`,
        cached: false,
      });
    }
    return NextResponse.json({ error: "Translation service not configured." }, { status: 503 });
  }

  // ── 3. Call Google Translate ──────────────────────────────────
  let translatedText: string;
  try {
    const url    = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
    const res    = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        q:      text,
        source: "el",
        target,
        format: "text",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[translate] Google API error:", res.status, errBody);
      return NextResponse.json({ error: "Translation service error." }, { status: 502 });
    }

    const data = await res.json() as {
      data?: { translations?: Array<{ translatedText: string }> };
    };
    translatedText = data?.data?.translations?.[0]?.translatedText ?? "";

    if (!translatedText) {
      return NextResponse.json({ error: "Empty translation result." }, { status: 502 });
    }
  } catch (err) {
    console.error("[translate] Fetch error:", err);
    return NextResponse.json({ error: "Network error calling translation service." }, { status: 502 });
  }

  // ── 4. Cache result in `professionals.bio_en` ─────────────────
  if (professionalId && target === "en") {
    const supabase = await createClient();
    await supabase
      .from("professionals")
      .update({ bio_en: translatedText })
      .eq("id", professionalId);
    // Fire-and-forget — don't block the response on the DB write
  }

  return NextResponse.json({ translatedText, cached: false });
}
