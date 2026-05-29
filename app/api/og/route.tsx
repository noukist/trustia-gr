// =============================================================
// app/api/og/route.tsx
// =============================================================
// Dynamic Open Graph image — 1200×630 px.
// Returned as a PNG by Next.js ImageResponse (next/og).
//
// URL: /api/og                         → default site image
//      /api/og?title=...&sub=...       → custom title + subtitle
//      /api/og?locale=en               → English variant
//
// Used in app/[locale]/layout.tsx openGraph.images
// =============================================================

import { ImageResponse } from "next/og";
import { NextRequest }   from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const locale = searchParams.get("locale") ?? "el";
  const title  = searchParams.get("title")  ??
    (locale === "en"
      ? "Find the expert for every need"
      : "Βρες τον ειδικό για κάθε ανάγκη");
  const sub    = searchParams.get("sub")    ??
    (locale === "en"
      ? "Trusted professionals across Greece"
      : "Αξιόπιστοι επαγγελματίες σε όλη την Ελλάδα");

  return new ImageResponse(
    (
      <div
        style={{
          width:           "1200px",
          height:          "630px",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "flex-start",
          justifyContent:  "flex-end",
          padding:         "72px 80px",
          background:      "linear-gradient(135deg, #0d4f4f 0%, #2A8F8F 60%, #3aafaf 100%)",
          fontFamily:      "system-ui, sans-serif",
          position:        "relative",
        }}
      >
        {/* Decorative circle top-right */}
        <div
          style={{
            position:        "absolute",
            top:             "-80px",
            right:           "-80px",
            width:           "420px",
            height:          "420px",
            borderRadius:    "50%",
            background:      "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position:        "absolute",
            top:             "60px",
            right:           "60px",
            width:           "220px",
            height:          "220px",
            borderRadius:    "50%",
            background:      "rgba(255,255,255,0.04)",
          }}
        />

        {/* Logo wordmark */}
        <div
          style={{
            position:   "absolute",
            top:        "60px",
            left:       "80px",
            display:    "flex",
            alignItems: "center",
            gap:        "12px",
          }}
        >
          <div
            style={{
              width:           "48px",
              height:          "48px",
              borderRadius:    "14px",
              background:      "rgba(255,255,255,0.18)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        "26px",
            }}
          >
            ✓
          </div>
          <span
            style={{
              fontSize:    "28px",
              fontWeight:  800,
              color:       "#fff",
              letterSpacing: "-0.5px",
            }}
          >
            TRUSTIA.GR
          </span>
        </div>

        {/* Accent bar */}
        <div
          style={{
            width:           "64px",
            height:          "5px",
            borderRadius:    "99px",
            backgroundColor: "#D4A039",
            marginBottom:    "24px",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize:    title.length > 40 ? "52px" : "62px",
            fontWeight:  800,
            color:       "#fff",
            lineHeight:  1.15,
            marginBottom: "20px",
            maxWidth:    "900px",
            letterSpacing: "-1px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize:  "28px",
            fontWeight: 400,
            color:     "rgba(255,255,255,0.75)",
            lineHeight: 1.4,
            maxWidth:  "760px",
          }}
        >
          {sub}
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  );
}
