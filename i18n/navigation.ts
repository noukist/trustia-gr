/**
 * i18n/navigation.ts
 *
 * Locale-aware wrappers around Next.js navigation APIs.
 * Import Link, redirect, usePathname, useRouter from HERE
 * (not from "next/link" or "next/navigation") inside any component
 * that needs locale-aware navigation.
 *
 * These wrappers automatically prepend the current locale prefix to hrefs
 * so you can write <Link href="/services"> and it renders as
 * /services (Greek) or /en/services (English) depending on context.
 */

import { createNavigation } from "next-intl/navigation";
import { routing }          from "./routing";

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
