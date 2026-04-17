// =============================================================
// AnnouncementBar.tsx — Top banner for urgent messaging
// =============================================================
// This thin strip sits above the Navbar on every page.
// It's the FIRST thing visitors see — before logo, before search.
//
// Purpose: Create urgency for the Founding Member offer.
// "Only 50 spots. Price locked forever. Act now."
//
// Design: Gold background (our accent color) with dark text.
// Gold = urgency, action, value. Matches our CTA buttons.
// Includes a counter showing remaining spots.
//
// Later: This counter will pull from the real database
// (Supabase) to show actual remaining spots. For now,
// we hardcode a number that we manually update.
// =============================================================

"use client";

import Link from "next/link";

// -------------------------------------------------------------
// Props — language + remaining spots count
// -------------------------------------------------------------
interface AnnouncementBarProps {
  lang: "el" | "en";
  /** How many founding member spots remain (manually updated for now) */
  remainingSpots: number;
}

export default function AnnouncementBar({ lang, remainingSpots }: AnnouncementBarProps) {
  const t = (el: string, en: string) => (lang === "el" ? el : en);

  return (
    <Link
      href="/pricing"
      className="
        block w-full
        bg-[var(--color-accent)]
        hover:bg-[var(--color-accent-light)]
        transition-colors
        py-2 px-4
        text-center
        cursor-pointer
      "
    >
      {/* ─── BANNER TEXT ─── */}
      {/* Bold key message + remaining spots counter */}
      <p className="text-sm font-semibold text-gray-900">
        {/* Fire emoji for urgency */}
        🔥{" "}
        {t("Ιδρυτικό Μέλος", "Founding Member")}
        {" — "}
        {t("Κλειδωμένη τιμή για πάντα", "Price locked forever")}
        {" — "}

        {/* Remaining spots in a dark pill for emphasis */}
        <span className="inline-block bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-full mx-1">
          {t(`Απομένουν ${remainingSpots} θέσεις`, `${remainingSpots} spots left`)}
        </span>

        {/* Arrow indicating it's clickable */}
        {" →"}
      </p>
    </Link>
  );
}