// =============================================================
// app/[locale]/not-found.tsx
// =============================================================
// Locale-aware 404 page.
//
// Shown when:
//   - notFound() is called from a page/layout
//   - No matching route exists inside [locale]/
//
// Uses next-intl's getLocale() to read the active locale from
// the request context set by the middleware, then renders a
// branded 404 screen with a link back to the home page.
// =============================================================

import type { Metadata }        from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link }                  from "@/i18n/navigation";

export const metadata: Metadata = {
  // Title is set dynamically below but this satisfies static export requirements.
  // next-intl will not call generateMetadata for not-found pages — the static
  // export is used as a fallback.
  title: "404",
};

export default async function NotFound() {
  const locale = await getLocale();
  const t      = await getTranslations({ locale, namespace: "notFound" });

  return (
    <main
      style={{
        minHeight:       "calc(100vh - 72px)",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "3rem 1.5rem",
        backgroundColor: "var(--color-bg-light)",
        textAlign:       "center",
      }}
    >
      {/* ── Large 404 graphic ── */}
      <p
        style={{
          fontSize:    "clamp(5rem, 20vw, 10rem)",
          fontWeight:  900,
          color:       "var(--color-primary)",
          margin:      0,
          lineHeight:  1,
          opacity:     0.15,
          userSelect:  "none",
        }}
      >
        404
      </p>

      {/* ── Brand icon ── */}
      <div
        style={{
          marginTop:       "-2rem",
          marginBottom:    "1.5rem",
          fontSize:        "3rem",
        }}
      >
        🔍
      </div>

      {/* ── Copy ── */}
      <h1
        style={{
          fontSize:      "clamp(1.375rem, 4vw, 2rem)",
          fontWeight:    800,
          color:         "var(--color-text)",
          margin:        "0 0 0.75rem",
          letterSpacing: "-0.025em",
        }}
      >
        {t("title")}
      </h1>

      <p
        style={{
          fontSize:     "1rem",
          color:        "var(--color-text-muted)",
          margin:       "0 0 2rem",
          maxWidth:     "400px",
          lineHeight:   1.6,
        }}
      >
        {t("description")}
      </p>

      {/* ── Back to home CTA ── */}
      <Link
        href="/"
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          padding:         "0.75rem 2rem",
          backgroundColor: "var(--color-primary)",
          color:           "#fff",
          borderRadius:    "10px",
          fontWeight:      700,
          fontSize:        "0.9375rem",
          textDecoration:  "none",
          transition:      "opacity 0.15s",
        }}
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
