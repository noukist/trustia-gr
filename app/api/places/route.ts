// =============================================================
// app/api/places/route.ts
// =============================================================
// Server-side proxy for the Google Places API.
//
// WHY a proxy?
//   The Google Places HTTP API requires an API key. By routing
//   requests through this server handler we keep the key in a
//   server-only environment variable (no NEXT_PUBLIC_ prefix),
//   preventing it from leaking into the client bundle.
//
//   The client component (LocationAutocomplete) calls this endpoint
//   instead of Google directly.
//
// Endpoints (both handled via query-param switching):
//
//   GET /api/places?input=Θεσσαλ&types=geocode&language=el
//     → Autocomplete suggestions list
//     Returns: { predictions: PlacePrediction[] }
//
//   GET /api/places?placeId=ChIJ…
//     → Place details (lat, lng, address components)
//     Returns: { result: PlaceDetail }
//
// Google API docs:
//   Autocomplete: https://developers.google.com/maps/documentation/places/web-service/autocomplete
//   Details:      https://developers.google.com/maps/documentation/places/web-service/details
// =============================================================

import { NextRequest, NextResponse } from "next/server";

// ── Constants ────────────────────────────────────────────────
const GOOGLE_AUTOCOMPLETE_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

// Detail fields we need — only request what's necessary to keep
// costs low (Places API charges per requested field in the new SKU).
const DETAIL_FIELDS = "geometry,formatted_address,address_components,name";

// Cache-Control header — autocomplete results are essentially real-time
// but short-lived caching reduces redundant API calls for the same query.
const CACHE_HEADER = "public, max-age=60, stale-while-revalidate=120";

// ── Helper: get the API key ───────────────────────────────────
function getApiKey(): string {
  // Prefer the server-only key (never exposed to the browser).
  // Fall back to the public key if only that is configured.
  const key =
    process.env.GOOGLE_MAPS_API_KEY ??          // server-only (preferred)
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;  // existing legacy key name

  if (!key) {
    throw new Error(
      "Missing Google Maps API key. Set GOOGLE_MAPS_API_KEY in your environment variables.",
    );
  }
  return key;
}

// ── GET handler ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const input   = searchParams.get("input");
  const placeId = searchParams.get("placeId");
  const types   = searchParams.get("types")   ?? "geocode";
  const language = searchParams.get("language") ?? "el"; // Greek by default

  // ── Route: Place Details ──────────────────────────────────
  // Called once the user selects a suggestion — returns lat/lng +
  // address components so we can extract the municipality.
  if (placeId) {
    let apiKey: string;
    try {
      apiKey = getApiKey();
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }

    const url = new URL(GOOGLE_DETAILS_URL);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", DETAIL_FIELDS);
    url.searchParams.set("language", language);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      // Next.js fetch caching — cache details for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Google Places Details API error", status: response.status },
        { status: 502 },
      );
    }

    const data = await response.json();

    // Relay the Google API status errors (e.g. ZERO_RESULTS, INVALID_REQUEST)
    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Google API status: ${data.status}` },
        { status: 400 },
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_HEADER },
    });
  }

  // ── Route: Autocomplete ───────────────────────────────────
  // Called on every keystroke (debounced by the client component).
  if (!input || input.trim().length < 2) {
    // Don't bother Google for very short inputs — return empty
    return NextResponse.json({ predictions: [] });
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }

  const url = new URL(GOOGLE_AUTOCOMPLETE_URL);
  url.searchParams.set("input", input.trim());
  url.searchParams.set("types", types);
  url.searchParams.set("language", language);
  // Restrict results to Greece only
  url.searchParams.set("components", "country:gr");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    // Short revalidation for autocomplete — results can change
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Google Places Autocomplete API error", status: response.status },
      { status: 502 },
    );
  }

  const data = await response.json();

  // Pass through even ZERO_RESULTS — the client handles empty arrays
  return NextResponse.json(data, {
    headers: { "Cache-Control": CACHE_HEADER },
  });
}
