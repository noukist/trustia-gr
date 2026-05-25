/**
 * i18n/routing.ts
 *
 * Single source of truth for locale routing configuration.
 *
 * Strategy: "as-needed" prefix
 *   - Greek (default) keeps existing URLs:   /services, /login, /dashboard
 *   - English gets a prefix:                 /en/services, /en/login, /en/dashboard
 *
 * This preserves any existing Google-indexed Greek URLs while adding
 * clean English equivalents for SEO targeting English-speaking expats.
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["el", "en"],
  defaultLocale: "el",

  // Greek stays prefix-free; English gets /en/...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
