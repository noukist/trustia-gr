// =============================================================
// app/layout.tsx — Root layout for Trustia.gr
// =============================================================
// This is a Server Component (no "use client").
// It wraps every page in the App Router.
//
// Responsibilities:
// - Load DM Sans font (Greek + Latin subsets) via next/font/google
// - Set the HTML lang attribute to "el" (Greek)
// - Export Next.js Metadata for SEO / Open Graph
// - Import global CSS (Tailwind + CSS variables)
// =============================================================

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

// Load DM Sans — latin-ext covers the extended Unicode range used by DM Sans.
// Note: next/font/google for DM Sans does not expose a "greek" subset key,
// but the DM Sans variable font file includes Greek glyphs within latin-ext.
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  // Variable font: include all weights so components can use font-weight freely
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  // Expose as a CSS variable so Tailwind @theme can reference it
  variable: "--font-dm-sans",
});

// ---------------------------------------------------------------
// SEO Metadata — rendered into <head> by Next.js automatically
// ---------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    // Default title shown on the homepage
    default: "Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη",
    // Template for inner pages: e.g. "Υδραυλικοί | Trustia.gr"
    template: "%s | Trustia.gr",
  },
  description:
    "Βρες αξιόπιστους επαγγελματίες για κάθε ανάγκη του σπιτιού σου. Υδραυλικός, ηλεκτρολόγος, καθαρισμός, ανακαίνιση και πολλά ακόμα.",
  // Canonical base URL — required for Open Graph absolute URLs
  metadataBase: new URL("https://trustia.gr"),
  openGraph: {
    title: "Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη",
    description:
      "Βρες αξιόπιστους επαγγελματίες για κάθε ανάγκη του σπιτιού σου.",
    url: "https://trustia.gr",
    siteName: "Trustia.gr",
    locale: "el_GR",
    type: "website",
  },
  // Greek keywords for search engines
  keywords: [
    "επαγγελματίες",
    "υπηρεσίες σπιτιού",
    "υδραυλικός",
    "ηλεκτρολόγος",
    "καθαριότητα",
    "ανακαίνιση",
    "Ελλάδα",
    "Trustia",
  ],
  // Prevent search engines from indexing pages marked with noindex metadata
  robots: {
    index: true,
    follow: true,
  },
};

// ---------------------------------------------------------------
// Root Layout Component
// ---------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang="el" tells browsers and screen readers this is a Greek-language site
    <html lang="el" className={dmSans.variable}>
      {/*
        dmSans.className applies the font-family directly.
        antialiased is a Tailwind utility class for smoother font rendering.
      */}
      <body className={`${dmSans.className} antialiased`}>{children}</body>
    </html>
  );
}
