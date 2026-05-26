// =============================================================
// app/layout.tsx — Thin root layout
// =============================================================
// This is the outermost layout — it handles <html> and <body>.
// All locale-specific concerns (Navbar, Footer, translations)
// are handled by app/[locale]/layout.tsx.
//
// The lang attribute is read from the x-next-intl-locale header
// that our proxy.ts sets on every request, so it correctly reflects
// the user's active locale (el or en).
// =============================================================

import React          from "react";
import { headers }    from "next/headers";
import { DM_Sans }    from "next/font/google";
import "./globals.css";

// DM Sans — latin-ext covers the extended Unicode range used by Greek
const dmSans = DM_Sans({
  subsets:  ["latin", "latin-ext"],
  weight:   ["300", "400", "500", "600", "700"],
  display:  "swap",
  variable: "--font-dm-sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the locale that next-intl detected for this request.
  // The proxy.ts middleware sets this header via createIntlMiddleware.
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "el";

  return (
    <html lang={locale} className={dmSans.variable} data-scroll-behavior="smooth">
      <body className={`${dmSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
