// =============================================================
// app/[locale]/layout.tsx
// =============================================================
// Locale-aware layout for all page routes.
//
// This wraps every page with:
//   1. NextIntlClientProvider — makes translations available to
//      all client components (Navbar, forms, etc.) via useTranslations()
//   2. Navbar + Footer — shared site shell
//   3. setRequestLocale() — enables static rendering for next-intl
//
// The root app/layout.tsx handles <html>/<body> and the font.
// This layout handles everything locale-specific.
// =============================================================

import React               from "react";
import { notFound }        from "next/navigation";
import type { Metadata }   from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale }     from "next-intl/server";
import { routing }         from "@/i18n/routing";
import Navbar              from "@/components/layout/Navbar";
import Footer              from "@/components/layout/Footer";
import AnnouncementBar     from "@/components/layout/AnnouncementBar";

// ── Metadata (locale-aware) ───────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEl = locale !== "en";
  return {
    title: {
      default: isEl
        ? "Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη"
        : "Trustia.gr — Find the expert for every need",
      template: "%s | Trustia.gr",
    },
    description: isEl
      ? "Βρες αξιόπιστους επαγγελματίες για κάθε ανάγκη. Υδραυλικός, ηλεκτρολόγος, καθαρισμός, ανακαίνιση και πολλά ακόμα."
      : "Find trusted professionals for every need in Greece. Plumbers, electricians, cleaning, renovation and more.",
    metadataBase: new URL("https://trustia.gr"),
    openGraph: {
      siteName: "Trustia.gr",
      locale:   isEl ? "el_GR" : "en_US",
      type:     "website",
      images: [
        {
          url:    `/api/og?locale=${locale}`,
          width:  1200,
          height: 630,
          alt:    isEl
            ? "Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη"
            : "Trustia.gr — Find the expert for every need",
        },
      ],
    },
    twitter: {
      card:   "summary_large_image",
      images: [`/api/og?locale=${locale}`],
    },
  };
}

// ── Static params — pre-render both locales at build time ─────
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ── Layout ───────────────────────────────────────────────────
type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Return 404 for any unknown locale segment (e.g. /fr/...)
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Load the translation messages for this locale
  const messages = await getMessages();

  return (
    // NextIntlClientProvider makes messages available to all
    // client components nested under this layout (e.g. Navbar, forms).
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AnnouncementBar locale={locale} />
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}