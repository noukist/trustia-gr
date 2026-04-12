import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

  if (!apiKey) {
    return NextResponse.json([]);
  }

  const url =
    "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
    "?input=" + encodeURIComponent(query) +
    "&components=country:gr" +
    "&types=(regions)" +
    "&language=el" +
    "&key=" + apiKey;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return NextResponse.json([]);
    }

    const results = data.predictions.map((p: Record<string, unknown>) => ({
      placeId: (p as Record<string, string>).place_id,
      name: ((p as Record<string, Record<string, string>>).structured_formatting || {}).main_text || (p as Record<string, string>).description,
      fullPath: (p as Record<string, string>).description,
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}