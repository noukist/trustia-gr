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
import Script         from "next/script";
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

  // Google Analytics — only loads when NEXT_PUBLIC_GA_ID is set.
  // Add G-XXXXXXXXXX to Vercel Environment Variables to activate.
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} className={dmSans.variable} data-scroll-behavior="smooth">
      <body className={`${dmSans.className} antialiased`}>
        {children}

        {/* ── Google Analytics 4 ── */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
