// =============================================================
// layout.tsx — Root layout for Trustia.gr
// =============================================================
// Wraps EVERY page. Contains:
// - AnnouncementBar (founding member urgency banner)
// - Navbar (navigation)
// - Page content
// - Footer
// =============================================================

"use client";

import { useState } from "react";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Language state — shared across the entire app
  const [lang, setLang] = useState<"el" | "en">("el");

  // Toggle between Greek and English
  const toggleLang = () => {
    setLang((prev) => (prev === "el" ? "en" : "el"));
  };

  return (
    <html lang={lang === "el" ? "el" : "en"}>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <title>Trustia.gr — Βρες τον ειδικό για κάθε ανάγκη</title>
        <meta
          name="description"
          content="Βρες αξιόπιστους επαγγελματίες για κάθε ανάγκη του σπιτιού σου. Υδραυλικός, ηλεκτρολόγος, καθαρισμός, ανακαίνιση και πολλά ακόμα."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* Gold banner at the very top — first thing visitors see */}
        {/* remainingSpots: manually update this as members sign up */}
        {/* Later: pull from Supabase automatically */}
        <AnnouncementBar lang={lang} remainingSpots={50} />

        {/* Navigation bar — sticky below the announcement */}
        <Navbar lang={lang} onToggleLang={toggleLang} />

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <Footer lang={lang} />
      </body>
    </html>
  );
}