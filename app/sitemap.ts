// =============================================================
// app/sitemap.ts
// =============================================================
// Dynamic sitemap for trustia.gr.
//
// STATIC ENTRIES
//   All public pages for both locales (el = no prefix, en = /en/).
//   Locale prefix strategy: "as-needed" — Greek has no prefix.
//
// DYNAMIC ENTRIES
//   All published professional profile pages fetched from Supabase.
//   Both locale variants are included (/professional/slug and
//   /en/professional/slug share the same content but serve locale).
//
// NOTE: This runs at request time (not statically exported) because
//   professional profiles are added/updated frequently.
// =============================================================

import type { MetadataRoute } from "next";
import { createClient }       from "@/lib/supabase/server";
import { CATEGORIES }         from "@/lib/constants";

const BASE = "https://trustia.gr";

// ── Static pages ──────────────────────────────────────────────
// Paths that don't have locale prefix for Greek (defaultLocale).
// English always gets /en prefix.
const STATIC_PATHS = [
  { path: "/",                       priority: 1.0, changeFrequency: "weekly"  as const },
  { path: "/services",               priority: 0.9, changeFrequency: "daily"   as const },
  { path: "/how-it-works",           priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/register",               priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/register/professional",  priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact",                priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/terms",                  priority: 0.2, changeFrequency: "yearly"  as const },
  { path: "/privacy",                priority: 0.2, changeFrequency: "yearly"  as const },
  { path: "/cookies",                priority: 0.2, changeFrequency: "yearly"  as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static entries (both locales) ─────────────────────────
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(({ path, priority, changeFrequency }) => [
    // Greek (no prefix)
    {
      url:             `${BASE}${path}`,
      lastModified:    new Date(),
      changeFrequency,
      priority,
    },
    // English (/en prefix)
    {
      url:             `${BASE}/en${path}`,
      lastModified:    new Date(),
      changeFrequency,
      priority: Math.max(priority - 0.1, 0.1),   // slightly lower than Greek
    },
  ]);

  // ── Dynamic professional profile pages ─────────────────────
  let proEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: professionals } = await supabase
      .from("professionals")
      .select("slug, updated_at")
      .eq("status", "active")
      .is("deleted_at", null)
      .not("slug", "is", null);

    proEntries = (professionals ?? []).flatMap((pro) => {
      if (!pro.slug) return [];
      const lastMod = pro.updated_at ? new Date(pro.updated_at) : new Date();
      return [
        // Greek
        {
          url:             `${BASE}/professional/${pro.slug}`,
          lastModified:    lastMod,
          changeFrequency: "weekly" as const,
          priority:        0.7,
        },
        // English
        {
          url:             `${BASE}/en/professional/${pro.slug}`,
          lastModified:    lastMod,
          changeFrequency: "weekly" as const,
          priority:        0.6,
        },
      ];
    });
  } catch {
    // Supabase unavailable at build time — return static entries only
  }

  // ── Category service pages ────────────────────────────────
  // /services?category=X are key landing pages for SEO — one per category.
  // Query-param URLs are valid in sitemaps (RFC 7230).
  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((cat) => [
    {
      url:             `${BASE}/services?category=${encodeURIComponent(cat.id)}`,
      lastModified:    new Date(),
      changeFrequency: "weekly" as const,
      priority:        0.8,
    },
    {
      url:             `${BASE}/en/services?category=${encodeURIComponent(cat.id)}`,
      lastModified:    new Date(),
      changeFrequency: "weekly" as const,
      priority:        0.7,
    },
  ]);

  return [...staticEntries, ...categoryEntries, ...proEntries];
}
