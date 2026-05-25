/**
 * i18n/request.ts
 *
 * Server-side configuration for next-intl.
 * Called on every server render to provide the locale and messages.
 *
 * The locale is read from the [locale] route segment (set by the proxy/middleware),
 * validated against our supported locales, and falls back to the default if missing.
 */

import { getRequestConfig } from "next-intl/server";
import { hasLocale }        from "next-intl";
import { routing }          from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is the [locale] segment value from the current URL
  const requested = await requestLocale;

  // Validate; fall back to Greek if the segment is missing or unsupported
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Dynamically import the matching JSON message file.
    // Next.js will only bundle the locale that's actually requested.
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
