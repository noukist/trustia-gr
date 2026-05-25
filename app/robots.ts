// =============================================================
// app/robots.ts
// =============================================================
// Generates /robots.txt for search engine crawlers.
// Allows all public pages, blocks admin/auth/dashboard routes.
// Points crawlers to the sitemap for efficient indexing.
// =============================================================

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/admin",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://trustia.gr/sitemap.xml",
    host:    "https://trustia.gr",
  };
}
